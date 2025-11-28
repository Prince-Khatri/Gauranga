import numpy as np
from scipy import signal
import pandas as pd

class TremorAnalyzer:
    def __init__(self, sampling_rate=30, window_size=100, overlap=0.5):
        """
        Initialize the TremorAnalyzer with sampling rate and analysis parameters.
        
        Args:
            sampling_rate (int): Sampling rate in Hz (frames per second)
            window_size (int): Size of the analysis window in samples
            overlap (float): Overlap between consecutive windows (0-1)
        """
        self.sampling_rate = sampling_rate
        self.window_size = window_size
        self.overlap = overlap
        self.hop_size = int(window_size * (1 - overlap))
        
    def calculate_tremor_features(self, landmarks):
        """
        Calculate tremor-related features from hand landmarks.
        
        Args:
            landmarks (np.array): Array of hand landmark coordinates (N x 21 x 3)
            
        Returns:
            dict: Dictionary containing tremor features
        """
        if len(landmarks) < self.window_size:
            raise ValueError(f"Insufficient samples. Need at least {self.window_size} samples.")
            
        # Calculate movement between consecutive frames
        movement = np.diff(landmarks, axis=0)
        
        # Calculate velocity (pixels per second)
        velocity = np.linalg.norm(movement, axis=2) * self.sampling_rate
        
        # Calculate acceleration
        acceleration = np.diff(velocity, axis=0) * self.sampling_rate
        
        # Calculate frequency domain features using Welch's method
        freqs, psd = signal.welch(
            velocity.mean(axis=1),  # Average velocity across all landmarks
            fs=self.sampling_rate,
            nperseg=min(256, len(velocity) // 4),
            noverlap=min(128, len(velocity) // 8)
        )
        
        # Find peak frequency in the tremor range (3-8 Hz)
        tremor_mask = (freqs >= 3) & (freqs <= 8)
        if np.any(tremor_mask):
            peak_freq = freqs[tremor_mask][np.argmax(psd[tremor_mask])]
            peak_power = np.max(psd[tremor_mask])
        else:
            peak_freq = 0
            peak_power = 0
            
        # Calculate time-domain features
        mean_velocity = np.mean(velocity)
        std_velocity = np.std(velocity)
        
        return {
            'tremor_frequency': float(peak_freq),
            'tremor_power': float(peak_power),
            'mean_velocity': float(mean_velocity),
            'velocity_std': float(std_velocity),
            'acceleration_std': float(np.std(acceleration)) if len(acceleration) > 0 else 0.0
        }
    
    def analyze_tremor_severity(self, features):
        """
        Analyze tremor severity based on extracted features.
        
        Args:
            features (dict): Dictionary of tremor features
            
        Returns:
            dict: Severity analysis with scores and classification
        """
        # Simple scoring system (can be refined with clinical data)
        tremor_score = 0
        
        # Frequency component (3-8 Hz is typical for Parkinsonian tremor)
        freq = features['tremor_frequency']
        power = features['tremor_power']
        
        if 3 <= freq <= 8 and power > 0.1:
            tremor_score += (power / 0.5) * 0.5  # Normalize and weight
            
        # Amplitude component
        vel_std = features['velocity_std']
        if vel_std > 5:  # Threshold in pixels/frame
            tremor_score += min(vel_std / 20, 0.5)  # Cap at 0.5
            
        # Clip score to [0, 1] range
        tremor_score = max(0, min(1, tremor_score))
        
        # Classify severity
        if tremor_score < 0.3:
            severity = "None to Mild"
        elif tremor_score < 0.6:
            severity = "Moderate"
        else:
            severity = "Severe"
            
        return {
            'tremor_score': tremor_score,
            'severity': severity,
            'confidence': min(0.9, tremor_score * 1.2)  # Confidence metric
        }
