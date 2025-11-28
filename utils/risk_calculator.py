import numpy as np
from datetime import datetime, date

class RiskCalculator:
    def __init__(self):
        """Initialize the RiskCalculator with default weights and thresholds."""
        # Weights for different components in the risk calculation
        self.weights = {
            'tremor': 0.35,
            'bradykinesia': 0.35,
            'demographics': 0.2,
            'symptoms': 0.1
        }
        
        # Thresholds for risk categories
        self.risk_thresholds = {
            'low': 0.3,
            'moderate': 0.6,
            'high': 0.8
        }
        
    def calculate_risk(self, test_results, user_info=None):
        """
        Calculate overall Parkinson's disease risk score.
        
        Args:
            test_results (dict): Dictionary containing test results
            user_info (dict, optional): Dictionary containing user demographic information
            
        Returns:
            dict: Dictionary containing risk score and interpretation
        """
        if user_info is None:
            user_info = {}
            
        # Calculate component scores
        tremor_score = self._calculate_tremor_risk(test_results.get('tremor', {}))
        bradykinesia_score = self._calculate_bradykinesia_risk(test_results.get('tap', {}))
        demographics_score = self._calculate_demographics_risk(user_info)
        symptoms_score = self._calculate_symptoms_risk(test_results.get('symptoms', {}))
        
        # Calculate weighted sum
        total_score = (
            tremor_score * self.weights['tremor'] +
            bradykinesia_score * self.weights['bradykinesia'] +
            demographics_score * self.weights['demographics'] +
            symptoms_score * self.weights['symptoms']
        )
        
        # Ensure score is between 0 and 1
        total_score = max(0, min(1, total_score))
        
        # Determine risk category
        if total_score < self.risk_thresholds['low']:
            risk_category = 'Low'
            recommendation = 'No immediate action needed. Continue monitoring.'
        elif total_score < self.risk_thresholds['moderate']:
            risk_category = 'Mild'
            recommendation = 'Consider lifestyle changes and monitor for progression.'
        elif total_score < self.risk_thresholds['high']:
            risk_category = 'Moderate'
            recommendation = 'Consult a healthcare professional for further evaluation.'
        else:
            risk_category = 'High'
            recommendation = 'Strongly recommend consultation with a movement disorder specialist.'
        
        # Generate explanation
        explanation = self._generate_explanation({
            'tremor': tremor_score,
            'bradykinesia': bradykinesia_score,
            'demographics': demographics_score,
            'symptoms': symptoms_score
        }, risk_category)
        
        return {
            'overall_risk_score': total_score,
            'risk_category': risk_category,
            'recommendation': recommendation,
            'explanation': explanation,
            'component_scores': {
                'tremor': tremor_score,
                'bradykinesia': bradykinesia_score,
                'demographics': demographics_score,
                'symptoms': symptoms_score
            }
        }
    
    def _calculate_tremor_risk(self, tremor_results):
        """Calculate risk score based on tremor analysis."""
        if not tremor_results:
            return 0.0
            
        # Extract relevant metrics
        tremor_score = tremor_results.get('tremor_score', 0)
        severity = tremor_results.get('severity', 'None to Mild')
        
        # Map severity to score if available
        if 'severity' in tremor_results:
            severity_map = {
                'None to Mild': 0.2,
                'Moderate': 0.5,
                'Severe': 0.9
            }
            return severity_map.get(severity, tremor_score)
            
        return tremor_score
    
    def _calculate_bradykinesia_risk(self, tap_results):
        """Calculate risk score based on tap test results."""
        if not tap_results:
            return 0.0
            
        # Extract relevant metrics
        bradykinesia_score = tap_results.get('bradykinesia_score', 0)
        severity = tap_results.get('severity', 'None to Mild')
        
        # Map severity to score if available
        if 'severity' in tap_results:
            severity_map = {
                'None to Mild': 0.2,
                'Moderate': 0.5,
                'Severe': 0.9
            }
            return severity_map.get(severity, bradykinesia_score)
            
        return bradykinesia_score
    
    def _calculate_demographics_risk(self, user_info):
        """Calculate risk score based on demographic factors."""
        if not user_info:
            return 0.0
            
        score = 0.0
        
        # Age factor
        if 'age' in user_info:
            age = int(user_info['age'])
            if age >= 70:
                score += 0.4
            elif age >= 60:
                score += 0.3
            elif age >= 50:
                score += 0.2
            elif age >= 40:
                score += 0.1
                
        # Gender factor (slightly higher risk for males)
        if user_info.get('gender', '').lower() == 'male':
            score += 0.05
            
        # Family history
        if user_info.get('family_history', '').lower() in ['yes', 'true', '1']:
            score += 0.2
            
        # Head injury history
        if user_info.get('head_injury', '').lower() in ['yes', 'true', '1']:
            score += 0.1
            
        # Pesticide exposure
        if user_info.get('pesticide_exposure', '').lower() in ['yes', 'true', '1']:
            score += 0.15
            
        return min(score, 1.0)
    
    def _calculate_symptoms_risk(self, symptoms):
        """Calculate risk score based on reported symptoms."""
        if not symptoms:
            return 0.0
            
        score = 0.0
        symptom_weights = {
            'rigidity': 0.3,
            'postural_instability': 0.25,
            'gait_difficulties': 0.25,
            'micrographia': 0.1,
            'loss_smell': 0.1
        }
        
        for symptom, weight in symptom_weights.items():
            if symptoms.get(symptom, False):
                score += weight
                
        # Adjust for symptom severity and duration
        severity = symptoms.get('symptom_severity', 'mild')
        duration = symptoms.get('symptom_duration', 0)  # in months
        
        # Adjust based on severity
        if severity == 'moderate':
            score *= 1.3
        elif severity == 'severe':
            score *= 1.6
            
        # Adjust based on duration (longer duration increases risk)
        if duration >= 24:  # 2+ years
            score = min(1.0, score * 1.4)
        elif duration >= 12:  # 1-2 years
            score = min(1.0, score * 1.2)
            
        return min(score, 1.0)
    
    def _generate_explanation(self, component_scores, risk_category):
        """Generate a human-readable explanation of the risk assessment."""
        explanations = []
        
        # Tremor explanation
        tremor_score = component_scores['tremor']
        if tremor_score > 0.6:
            explanations.append("Significant tremor was detected")
        elif tremor_score > 0.3:
            explanations.append("Mild tremor was detected")
            
        # Bradykinesia explanation
        bradykinesia_score = component_scores['bradykinesia']
        if bradykinesia_score > 0.6:
            explanations.append("Significant slowness of movement was observed")
        elif bradykinesia_score > 0.3:
            explanations.append("Mild slowness of movement was observed")
            
        # Demographics explanation
        demographics_score = component_scores['demographics']
        if demographics_score > 0.5:
            explanations.append("Demographic factors indicate elevated risk")
            
        # Symptoms explanation
        symptoms_score = component_scores['symptoms']
        if symptoms_score > 0.5:
            explanations.append("Reported symptoms are concerning")
        
        if not explanations:
            return "No significant risk factors were identified."
            
        return f"{risk_category} risk assessment is based on: " + "; ".join(explanations) + "."
    
    def calculate_progression_risk(self, historical_data):
        """
        Calculate the risk of disease progression based on historical test data.
        
        Args:
            historical_data (list): List of historical test results with timestamps
            
        Returns:
            dict: Progression risk assessment
        """
        if not historical_data or len(historical_data) < 2:
            return {
                'progression_risk': 'unknown',
                'confidence': 'low',
                'recommendation': 'Insufficient data to assess progression. More tests over time are needed.'
            }
            
        # Sort data by date
        sorted_data = sorted(historical_data, key=lambda x: x.get('timestamp', ''))
        
        # Extract risk scores and timestamps
        timestamps = []
        risk_scores = []
        
        for entry in sorted_data:
            if 'risk_score' in entry:
                risk_scores.append(float(entry['risk_score']))
                try:
                    # Try to parse timestamp
                    if isinstance(entry['timestamp'], str):
                        dt = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
                    else:
                        dt = entry['timestamp']
                    timestamps.append(dt.timestamp())
                except (ValueError, AttributeError):
                    # If timestamp parsing fails, use index as a proxy
                    timestamps.append(len(timestamps))
        
        if len(risk_scores) < 2:
            return {
                'progression_risk': 'unknown',
                'confidence': 'low',
                'recommendation': 'Insufficient valid data points to assess progression.'
            }
        
        # Calculate rate of change
        x = np.array(timestamps)
        y = np.array(risk_scores)
        
        # Normalize timestamps to start at 0
        x = x - x[0]
        
        # Calculate slope (rate of change per day)
        if x[-1] - x[0] > 0:
            slope = (y[-1] - y[0]) / ((x[-1] - x[0]) / (24 * 60 * 60))  # Convert to per day
        else:
            slope = 0
            
        # Classify progression risk
        if slope > 0.001:  # Significant increase
            progression_risk = 'high'
        elif slope > 0.0001:  # Slight increase
            progression_risk = 'moderate'
        elif slope < -0.001:  # Significant decrease
            progression_risk = 'decreasing'
        else:  # Stable
            progression_risk = 'low'
            
        # Calculate confidence
        confidence = min(0.9, 0.5 + len(risk_scores) * 0.1)  # More data points = higher confidence
        
        # Generate recommendation
        if progression_risk == 'high':
            recommendation = "Significant progression detected. Please consult a healthcare professional immediately."
        elif progression_risk == 'moderate':
            recommendation = "Mild progression detected. Consider scheduling a follow-up with your doctor."
        elif progression_risk == 'decreasing':
            recommendation = "Improvement in symptoms detected. Continue with current management plan."
        else:
            recommendation = "Stable condition. Continue with regular monitoring."
            
        return {
            'progression_risk': progression_risk,
            'rate_of_change': float(slope * 30),  # Per month
            'confidence': f"{confidence:.1%}",
            'recommendation': recommendation,
            'data_points': len(risk_scores),
            'time_span_days': (x[-1] - x[0]) / (24 * 60 * 60) if len(x) > 1 else 0
        }
