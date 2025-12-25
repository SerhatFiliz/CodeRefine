import os
import shutil
import tempfile
import git
import ast
import re
import tiktoken
from pathlib import Path

class GitHubService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        # Initialize tokenizer for cl100k_base (used by GPT-4, Llama 3, etc.)
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except:
            # Fallback if tiktoken fails (though it shouldn't)
            self.tokenizer = None

    def clone_repository(self, repo_url: str) -> str:
        """
        Clones a GitHub repository to a temporary directory.
        Returns the path to the cloned repository.
        """
        repo_name = repo_url.split("/")[-1].replace(".git", "")
        target_dir = os.path.join(self.temp_dir, "code_refine_repos", repo_name)
        
        # Clean up if exists
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
            
        try:
            git.Repo.clone_from(repo_url, target_dir)
            return target_dir
        except Exception as e:
            raise Exception(f"Failed to clone repository: {str(e)}")

    def _get_token_count(self, text: str) -> int:
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        return len(text) // 4  # Fallback approximation

    def _extract_skeleton(self, code: str, extension: str) -> str:
        """
        Extracts the structural skeleton of the code (Classes, Functions, Docstrings).
        Removes implementation details to save tokens.
        """
        try:
            if extension == '.py':
                return self._skeletonize_python(code)
            elif extension in ['.js', '.ts', '.jsx', '.tsx']:
                return self._skeletonize_js(code)
            return code # Return full code if not supported
        except Exception as e:
            print(f"Skeleton extraction failed: {e}")
            return code # Fallback to full code

    def _skeletonize_python(self, code: str) -> str:
        try:
            tree = ast.parse(code)
        except SyntaxError:
            return code

        class SkeletonVisitor(ast.NodeTransformer):
            def visit_FunctionDef(self, node):
                # Keep docstring
                docstring = ast.get_docstring(node)
                new_body = []
                if docstring:
                    new_body.append(ast.Expr(value=ast.Constant(value=docstring)))
                new_body.append(ast.Expr(value=ast.Constant(value="...")))
                node.body = new_body
                return node

            def visit_AsyncFunctionDef(self, node):
                return self.visit_FunctionDef(node)

            def visit_ClassDef(self, node):
                # Process methods inside class
                self.generic_visit(node)
                return node

        visitor = SkeletonVisitor()
        new_tree = visitor.visit(tree)
        return ast.unparse(new_tree)

    def _skeletonize_js(self, code: str) -> str:
        # Simple Regex-based skeletonizer for JS/TS
        # 1. Remove function bodies: function foo() { ... } -> function foo() { ... }
        # This is hard with regex. A simpler approach is to truncate long blocks.
        # For now, let's just keep imports and signatures if possible, or just return first 50 lines.
        
        lines = code.split('\n')
        skeleton = []
        for line in lines:
            line = line.strip()
            if line.startswith('import') or line.startswith('export') or line.startswith('class') or line.startswith('function') or '=>' in line:
                skeleton.append(line)
            elif line.startswith('//') or line.startswith('/*'):
                 skeleton.append(line)
        
        return "\n".join(skeleton)

    def _get_file_score(self, file_path: Path, repo_root: Path) -> int:
        """
        Calculates a relevance score for a file. Higher score = more important.
        """
        score = 10
        rel_path = file_path.relative_to(repo_root)
        parts = rel_path.parts
        filename = file_path.name.lower()
        
        # 1. Critical Configuration & Documentation (Highest Priority)
        if filename in ['readme.md', 'requirements.txt', 'package.json', 'pom.xml', 'build.gradle', 'go.mod', 'cargo.toml', 'dockerfile', 'docker-compose.yml']:
            return 100
            
        # 2. Key Entry Points
        if filename in ['main.py', 'app.py', 'index.js', 'server.js', 'manage.py', 'application.java']:
            return 90

        # 3. Core Source Directories
        # Check if any part of the path indicates a core directory
        important_dirs = {'src', 'app', 'core', 'api', 'services', 'models', 'controllers', 'routes', 'lib', 'utils', 'components'}
        if any(part.lower() in important_dirs for part in parts):
            score += 40
            
        # 4. Penalize Tests and Docs
        ignore_dirs = {'test', 'tests', '__tests__', 'docs', 'documentation', 'examples', 'samples', 'demo', 'migration', 'migrations', 'seed', 'seeds'}
        if any(part.lower() in ignore_dirs for part in parts):
            return 0  # Skip completely or very low priority
            
        # 5. Penalize Lock Files and Assets
        if filename.endswith(('.lock', '.map', '.min.js', '.svg', '.png', '.jpg', '.jpeg', '.css')):
            return 0

        # 6. Prefer shallower paths (closer to root)
        # Depth 0 (root) = +20, Depth 1 = +10, Depth 2 = +0...
        depth_bonus = max(0, 20 - (len(parts) * 5))
        score += depth_bonus
        
        return score

    def get_repository_content(self, repo_path: str, max_tokens: int = 12000) -> str:
        """
        Smartly selects and compresses repository content to fit within max_tokens.
        Uses AST Skeleton for non-critical files.
        """
        allowed_extensions = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.html', '.css', '.scss', '.vue', '.svelte', '.json', '.xml', '.yaml', '.yml', '.md'}
        ignored_dirs = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', '.next', '.idea', '.vscode'}
        
        repo_path_obj = Path(repo_path)
        scored_files = []
        
        # 1. Scan and Score all files
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in allowed_extensions:
                    score = self._get_file_score(file_path, repo_path_obj)
                    if score > 0:
                        scored_files.append((score, file_path))
        
        # 2. Sort by Score (Desc)
        scored_files.sort(key=lambda x: x[0], reverse=True)
        
        content_buffer = []
        current_tokens = 0
        # Reserve 1000 tokens for system prompt and JSON overhead
        token_limit = max_tokens - 1000 
        
        selected_files_count = 0
        
        for score, file_path in scored_files:
            if current_tokens >= token_limit:
                break

            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    file_content = f.read()
                    
                    # DECISION: Full Code vs Skeleton
                    # Score >= 80: Full Code (Critical)
                    # Score < 80: Skeleton (Context)
                    
                    is_full_code = score >= 80
                    processed_content = file_content
                    
                    if not is_full_code:
                        processed_content = self._extract_skeleton(file_content, file_path.suffix)
                        header_tag = "SKELETON"
                    else:
                        header_tag = "FULL"

                    header = f"\n\n--- FILE: {file_path.relative_to(repo_path_obj)} ({header_tag}, Score: {score}) ---\n\n"
                    entry_text = header + processed_content
                    entry_tokens = self._get_token_count(entry_text)
                    
                    if current_tokens + entry_tokens > token_limit:
                        # Try to fit at least the header? No, cleaner to skip.
                        continue
                        
                    content_buffer.append(entry_text)
                    current_tokens += entry_tokens
                    selected_files_count += 1
                    
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                continue
                
        print(f"DEBUG: Selected {selected_files_count} files. Total Tokens: {current_tokens}/{token_limit}")
        return "".join(content_buffer)

    def clone_and_prepare(self, repo_url: str, max_tokens: int) -> tuple:
        """
        Clones the repo and prepares the content string respecting the token limit.
        Returns (repo_path, code_content)
        """
        try:
            repo_path = self.clone_repository(repo_url)
            code_content = self.get_repository_content(repo_path, max_tokens=max_tokens)
            return repo_path, code_content
        except Exception as e:
            print(f"Error in clone_and_prepare: {e}")
            if 'repo_path' in locals() and repo_path:
                self.cleanup(repo_path)
            return None, None

    def cleanup(self, repo_path: str):
        self.cleanup_repository(repo_path)

    def cleanup_repository(self, repo_path: str):
        """
        Removes the cloned repository from the temporary directory.
        """
        if os.path.exists(repo_path):
            try:
                shutil.rmtree(repo_path)
            except Exception as e:
                print(f"Error cleaning up repository {repo_path}: {e}")
