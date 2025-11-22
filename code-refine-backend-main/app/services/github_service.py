import os
import shutil
import tempfile
import git
from pathlib import Path

class GitHubService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()

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

    def get_repository_content(self, repo_path: str, max_tokens: int = 100000) -> str:
        """
        Traverses the repository and returns a concatenated string of code files.
        Respects a rough token limit (char count approximation).
        """
        allowed_extensions = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.html', '.css', '.scss', '.vue', '.svelte', '.json', '.xml', '.yaml', '.yml', '.md'}
        ignored_dirs = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', '.next', '.idea', '.vscode'}
        
        content_buffer = []
        total_chars = 0
        char_limit = max_tokens * 4  # Rough approximation
        
        repo_path_obj = Path(repo_path)
        
        for root, dirs, files in os.walk(repo_path):
            # Filter ignored directories
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in allowed_extensions:
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            file_content = f.read()
                            
                            # Add file header
                            header = f"\n\n--- FILE: {file_path.relative_to(repo_path_obj)} ---\n\n"
                            
                            if total_chars + len(header) + len(file_content) > char_limit:
                                content_buffer.append(f"\n\n[TRUNCATED DUE TO SIZE LIMIT] Reached limit at {file_path.name}")
                                return "".join(content_buffer)
                                
                            content_buffer.append(header)
                            content_buffer.append(file_content)
                            total_chars += len(header) + len(file_content)
                            
                    except Exception as e:
                        print(f"Error reading file {file_path}: {e}")
                        continue
                        
        return "".join(content_buffer)

    def cleanup_repository(self, repo_path: str):
        """
        Removes the cloned repository from the temporary directory.
        """
        if os.path.exists(repo_path):
            try:
                shutil.rmtree(repo_path)
            except Exception as e:
                print(f"Error cleaning up repository {repo_path}: {e}")
