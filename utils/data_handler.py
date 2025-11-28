import os
import pandas as pd
from datetime import datetime
import json
from pathlib import Path

class DataHandler:
    def __init__(self, data_dir='data'):
        """
        Initialize the DataHandler with the data directory.
        
        Args:
            data_dir (str): Directory to store data files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.user_data_file = self.data_dir / 'user_data.csv'
        self._initialize_user_data()
        
    def _initialize_user_data(self):
        """Initialize the user data file if it doesn't exist."""
        if not self.user_data_file.exists():
            df = pd.DataFrame(columns=[
                'user_id', 'timestamp', 'test_type', 
                'tremor_score', 'bradykinesia_score', 'risk_score',
                'test_duration', 'test_parameters', 'raw_data_path'
            ])
            df.to_csv(self.user_data_file, index=False)
    
    def save_test_results(self, user_id, test_type, results):
        """
        Save test results to the user data file.
        
        Args:
            user_id (str): Unique identifier for the user
            test_type (str): Type of test ('tremor', 'tap', 'survey')
            results (dict): Dictionary containing test results
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        try:
            # Prepare the data for saving
            timestamp = datetime.now().isoformat()
            
            # Extract relevant metrics based on test type
            if test_type == 'tremor':
                metrics = {
                    'tremor_score': results.get('tremor_score', 0),
                    'bradykinesia_score': 0,
                    'risk_score': results.get('tremor_score', 0) * 0.6  # Weight for tremor in overall risk
                }
            elif test_type == 'tap':
                metrics = {
                    'tremor_score': 0,
                    'bradykinesia_score': results.get('bradykinesia_score', 0),
                    'risk_score': results.get('bradykinesia_score', 0) * 0.4  # Weight for bradykinesia
                }
            else:  # survey
                metrics = {
                    'tremor_score': 0,
                    'bradykinesia_score': 0,
                    'risk_score': results.get('risk_score', 0)
                }
            
            # Create a new row of data
            new_data = {
                'user_id': user_id,
                'timestamp': timestamp,
                'test_type': test_type,
                **metrics,
                'test_duration': results.get('test_duration', 0),
                'test_parameters': json.dumps(results.get('parameters', {})),
                'raw_data_path': results.get('raw_data_path', '')
            }
            
            # Append to the CSV file
            new_df = pd.DataFrame([new_data])
            new_df.to_csv(self.user_data_file, mode='a', header=False, index=False)
            
            return True
            
        except Exception as e:
            print(f"Error saving test results: {str(e)}")
            return False
    
    def get_user_history(self, user_id, limit=10):
        """
        Get test history for a specific user.
        
        Args:
            user_id (str): User ID to get history for
            limit (int): Maximum number of results to return
            
        Returns:
            pd.DataFrame: DataFrame containing the user's test history
        """
        try:
            if not self.user_data_file.exists():
                return pd.DataFrame()
                
            df = pd.read_csv(self.user_data_file)
            user_df = df[df['user_id'] == user_id].sort_values('timestamp', ascending=False).head(limit)
            
            # Parse the test parameters
            if 'test_parameters' in user_df.columns:
                user_df['test_parameters'] = user_df['test_parameters'].apply(
                    lambda x: json.loads(x) if pd.notna(x) and x != '' else {}
                )
                
            return user_df
            
        except Exception as e:
            print(f"Error retrieving user history: {str(e)}")
            return pd.DataFrame()
    
    def get_aggregate_metrics(self, user_id):
        """
        Get aggregate metrics for a user across all tests.
        
        Args:
            user_id (str): User ID to get metrics for
            
        Returns:
            dict: Dictionary containing aggregate metrics
        """
        try:
            df = self.get_user_history(user_id, limit=100)  # Get up to 100 most recent tests
            if df.empty:
                return {}
                
            # Calculate aggregate metrics
            metrics = {
                'total_tests': len(df),
                'last_test_date': df['timestamp'].max(),
                'average_risk_score': df['risk_score'].mean(),
                'max_risk_score': df['risk_score'].max(),
                'test_types': df['test_type'].value_counts().to_dict(),
                'risk_trend': self._calculate_risk_trend(df),
                'last_tremor_score': df[df['test_type'] == 'tremor']['tremor_score'].iloc[0] if 'tremor' in df['test_type'].values else None,
                'last_bradykinesia_score': df[df['test_type'] == 'tap']['bradykinesia_score'].iloc[0] if 'tap' in df['test_type'].values else None
            }
            
            return metrics
            
        except Exception as e:
            print(f"Error calculating aggregate metrics: {str(e)}")
            return {}
    
    def _calculate_risk_trend(self, df):
        """Calculate the trend of risk scores over time."""
        if len(df) < 2:
            return 'stable'
            
        # Convert timestamp to datetime and sort
        df['datetime'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('datetime')
        
        # Calculate simple linear regression slope
        x = (df['datetime'] - df['datetime'].min()).dt.total_seconds()
        y = df['risk_score'].values
        
        if len(x) < 2 or len(y) < 2 or len(set(y)) == 1:
            return 'stable'
            
        slope = (len(x) * (x * y).sum() - x.sum() * y.sum()) / (len(x) * (x**2).sum() - x.sum()**2)
        
        if slope > 0.01:
            return 'increasing'
        elif slope < -0.01:
            return 'decreasing'
        else:
            return 'stable'
    
    def export_user_data(self, user_id, output_format='csv'):
        """
        Export all data for a user in the specified format.
        
        Args:
            user_id (str): User ID to export data for
            output_format (str): Output format ('csv' or 'json')
            
        Returns:
            str: Path to the exported file
        """
        try:
            df = self.get_user_history(user_id, limit=1000)  # Get all available history
            if df.empty:
                return None
                
            export_dir = self.data_dir / 'exports'
            export_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{user_id}_export_{timestamp}"
            
            if output_format.lower() == 'json':
                filepath = export_dir / f"{filename}.json"
                df.to_json(filepath, orient='records', indent=2)
            else:  # default to CSV
                filepath = export_dir / f"{filename}.csv"
                df.to_csv(filepath, index=False)
                
            return str(filepath)
            
        except Exception as e:
            print(f"Error exporting user data: {str(e)}")
            return None
