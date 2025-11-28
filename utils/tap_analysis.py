import numpy as np
from scipy import stats
import pandas as pd

class TapAnalyzer:
    def __init__(self, sampling_rate=30, tap_threshold=0.1):
        """
        Initialize the TapAnalyzer with sampling rate and tap detection parameters.
        
        Args:
            sampling_rate (int): Sampling rate in Hz (frames per second)
            tap_threshold (float): Threshold for detecting a tap (normalized distance)
        """
        self.sampling_rate = sampling_rate
        self.tap_threshold = tap_threshold
        self.min_tap_interval = 0.2  # Minimum time between taps (seconds)
        self.min_tap_duration = 0.05  # Minimum tap duration (seconds)
        
    def detect_taps(self, index_tip_positions):
        """
        Detect tap events from index finger tip positions.
        
        Args:
            index_tip_positions (np.array): Array of (x, y, z) positions of the index finger tip
            
        Returns:
            dict: Dictionary containing tap events and features
        """
        if len(index_tip_positions) < 10:  # Need at least 10 samples
            return {
                'tap_count': 0,
                'tap_intervals': [],
                'tap_durations': [],
                'tap_features': {}
            }
            
        # Calculate vertical movement (assuming y-axis is up/down)
        y_pos = index_tip_positions[:, 1]
        y_velocity = np.diff(y_pos) * self.sampling_rate
        
        # Find potential tap events (downward movements)
        tap_starts = []
        tap_ends = []
        in_tap = False
        
        for i in range(1, len(y_velocity)):
            # Detect tap start (significant downward movement)
            if not in_tap and y_velocity[i] < -self.tap_threshold * self.sampling_rate:
                tap_starts.append(i)
                in_tap = True
            # Detect tap end (movement stops or reverses)
            elif in_tap and y_velocity[i] >= 0:
                tap_ends.append(i)
                in_tap = False
                
        # If we're still in a tap at the end, add the last sample as end
        if in_tap:
            tap_ends.append(len(y_velocity) - 1)
            
        # Filter out taps that are too short
        valid_taps = []
        for start, end in zip(tap_starts, tap_ends):
            duration = (end - start) / self.sampling_rate
            if duration >= self.min_tap_duration:
                valid_taps.append((start, end, duration))
                
        # Calculate inter-tap intervals
        tap_intervals = []
        if len(valid_taps) > 1:
            tap_times = [start / self.sampling_rate for start, _, _ in valid_taps]
            tap_intervals = np.diff(tap_times)
            
        # Extract tap features
        tap_features = self._calculate_tap_features(valid_taps, tap_intervals, y_pos)
        
        return {
            'tap_count': len(valid_taps),
            'tap_intervals': tap_intervals.tolist() if len(tap_intervals) > 0 else [],
            'tap_durations': [t[2] for t in valid_taps],
            'tap_features': tap_features
        }
        
    def _calculate_tap_features(self, valid_taps, tap_intervals, y_positions):
        """
        Calculate features from tap events.
        
        Args:
            valid_taps (list): List of (start, end, duration) tuples for each tap
            tap_intervals (np.array): Array of inter-tap intervals in seconds
            y_positions (np.array): Array of y-coordinates of the finger
            
        Returns:
            dict: Dictionary of tap features
        """
        if not valid_taps:
            return {
                'mean_interval': 0,
                'interval_variability': 0,
                'mean_duration': 0,
                'amplitude': 0,
                'bradykinesia_score': 0
            }
            
        # Calculate tap amplitudes (peak-to-peak)
        tap_amplitudes = []
        for start, end, _ in valid_taps:
            if end > start:  # Ensure valid tap
                tap_amplitudes.append(np.max(y_positions[start:end+1]) - np.min(y_positions[start:end+1]))
                
        # Calculate features
        features = {
            'mean_interval': float(np.mean(tap_intervals)) if len(tap_intervals) > 0 else 0,
            'interval_variability': float(np.std(tap_intervals) / np.mean(tap_intervals)) if len(tap_intervals) > 0 and np.mean(tap_intervals) > 0 else 0,
            'mean_duration': float(np.mean([t[2] for t in valid_taps])) if valid_taps else 0,
            'amplitude': float(np.mean(tap_amplitudes)) if tap_amplitudes else 0,
        }
        
        # Calculate bradykinesia score (higher = more severe)
        # This is a simplified version - can be refined with clinical data
        bradykinesia_score = 0
        
        # Slower tapping increases score
        if features['mean_interval'] > 0.5:  # More than 2 taps per second is normal
            bradykinesia_score += min(0.5, (features['mean_interval'] - 0.5) / 2)
            
        # More variable intervals increases score
        if features['interval_variability'] > 0.2:
            bradykinesia_score += min(0.3, features['interval_variability'] - 0.2)
            
        # Longer tap duration increases score
        if features['mean_duration'] > 0.1:  # Normal tap duration is typically < 100ms
            bradykinesia_score += min(0.2, (features['mean_duration'] - 0.1) * 2)
            
        features['bradykinesia_score'] = min(1.0, bradykinesia_score)
        
        return features
    
    def analyze_tap_performance(self, tap_data):
        """
        Analyze tap test performance and provide a clinical interpretation.
        
        Args:
            tap_data (dict): Output from detect_taps()
            
        Returns:
            dict: Analysis results with scores and interpretation
        """
        if tap_data['tap_count'] < 2:
            return {
                'bradykinesia_score': 0,
                'severity': 'Insufficient data',
                'confidence': 0,
                'interpretation': 'Not enough taps detected for reliable analysis.'
            }
            
        features = tap_data['tap_features']
        score = features['bradykinesia_score']
        
        # Classify severity
        if score < 0.3:
            severity = "None to Mild"
        elif score < 0.6:
            severity = "Moderate"
        else:
            severity = "Severe"
            
        # Calculate confidence based on number of taps and variability
        confidence = min(0.95, 0.7 + (min(tap_data['tap_count'], 20) / 40))
        if features['interval_variability'] > 0.4:
            confidence *= 0.9  # Slightly reduce confidence for highly variable tapping
            
        interpretation = self._generate_interpretation(features, severity)
        
        return {
            'bradykinesia_score': score,
            'severity': severity,
            'confidence': confidence,
            'interpretation': interpretation
        }
        
    def _generate_interpretation(self, features, severity):
        """Generate a human-readable interpretation of tap test results."""
        interpretations = []
        
        if features['mean_interval'] > 0.5:
            interpretations.append(f"Slower than average tapping speed ({1/features['mean_interval']:.1f} taps/second)")
            
        if features['interval_variability'] > 0.3:
            interpretations.append("Inconsistent rhythm between taps")
            
        if features['mean_duration'] > 0.1:
            interpretations.append(f"Prolonged tap duration ({features['mean_duration']*1000:.0f}ms per tap)")
            
        if not interpretations:
            interpretations.append("Normal tapping pattern detected")
            
        return f"{severity} bradykinesia: " + "; ".join(interpretations) + "."
