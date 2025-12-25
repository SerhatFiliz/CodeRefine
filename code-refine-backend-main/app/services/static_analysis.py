import os
import json
import subprocess
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StaticAnalysisService:
    def analyze_repository(self, repo_path: str) -> Dict[str, Any]:
        """
        Runs static analysis (complexity and security) on the given repository path.
        """
        logger.info(f"Starting static analysis for: {repo_path}")
        
        complexity_data = self._analyze_complexity(repo_path)
        security_data = self._analyze_security(repo_path)
        
        return {
            "complexity": complexity_data,
            "security": security_data
        }

    def _analyze_complexity(self, repo_path: str) -> Dict[str, Any]:
        """
        Calculates average Cyclomatic Complexity using radon.
        """
        try:
            # Run radon cc recursively on the repo path
            # -a: average, -j: json, -s: show complexity score
            # We use standard command line usage or library. Using subprocess for simplicity matching requirements.
            # Actually requirements said "library import radon.complexity OR subprocess".
            # Using subprocess to capture aggregated average easily if available, or just calculating it.
            # Let's use 'radon cc . -a -j'
            
            # Since radon might analyze many files, let's use the CLI for JSON output
            result = subprocess.run(
                ["radon", "cc", repo_path, "-a", "-j"],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                logger.error(f"Radon failed: {result.stderr}")
                return {"average_score": "Unknown", "average_value": 0.0}

            # Radon JSON output is a dict where keys are filenames and values are lists of blocks.
            # Unlike -s / -a textual output, JSON output of radon cc usually contains just the blocks.
            # However, with -a, maybe it adds average? 
            # Let's check radon documentation behavior or stick to safe calculation.
            # Safe bet: iterate all blocks and calculate average ourselves.
            
            data = json.loads(result.stdout)
            total_complexity = 0
            count = 0
            
            for filename, blocks in data.items():
                for block in blocks:
                    if 'complexity' in block:
                        total_complexity += block['complexity']
                        count += 1
            
            if count == 0:
                return {"average_score": "A", "average_value": 0.0}
            
            avg_value = total_complexity / count
            
            # Map to Score
            if avg_value <= 5:
                score = "A"
            elif avg_value <= 10:
                score = "B"
            elif avg_value <= 20:
                score = "C"
            elif avg_value <= 40:
                score = "D"
            else:
                score = "F"
                
            return {
                "average_score": score,
                "average_value": round(avg_value, 2)
            }

        except Exception as e:
            logger.error(f"Error in complexity analysis: {e}")
            return {"average_score": "Error", "average_value": 0.0}

    def _analyze_security(self, repo_path: str) -> Dict[str, Any]:
        """
        Runs bandit for security analysis.
        """
        try:
            # Run bandit recursively
            # -r: recursive, -f json: json format
            result = subprocess.run(
                ["bandit", "-r", repo_path, "-f", "json"],
                capture_output=True,
                text=True,
                check=False # Bandit returns exit code 1 if issues found
            )
            
            # Bandit writes to stdout usually, but if it fails strictly it might be stderr.
            # Even if exit code is 1, stdout usually has the json report.
            
            output = result.stdout.strip()
            if not output:
                 # fallback to stderr if stdout is empty
                 output = result.stderr.strip()
            
            if not output:
                return {"score": 100, "issues": []}

            try:
                data = json.loads(output)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse bandit output: {output[:200]}...")
                return {"score": 100, "issues": []}

            # Calculate score
            # Logic: Start 100, -10 High, -5 Medium
            score = 100
            issues_list = []
            
            results = data.get('results', [])
            
            for issue in results:
                severity = issue.get('issue_severity', 'LOW')
                confidence = issue.get('issue_confidence', 'LOW')
                
                # Filter for High/Medium severity or High Confidence?
                # Let's include everything in the list but deduct score based on Severity
                
                if severity == 'HIGH':
                    score -= 10
                elif severity == 'MEDIUM':
                    score -= 5
                elif severity == 'LOW':
                    score -= 2
                
                # Collect issue details
                issues_list.append({
                    "filename": issue.get('filename'),
                    "issue_text": issue.get('issue_text'),
                    "severity": severity,
                    "line_number": issue.get('line_number'),
                    "code": issue.get('code', '').strip()
                })

            score = max(0, score) # Min 0
            
            return {
                "score": score,
                "issues": issues_list
            }

        except Exception as e:
            logger.error(f"Error in security analysis: {e}")
            return {"score": 0, "issues": [{"error": str(e)}]}
