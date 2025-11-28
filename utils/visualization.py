import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

class VisualizationEngine:
    """Class for generating visualizations of test results and risk assessments."""
    
    @staticmethod
    def plot_tremor_analysis(tremor_data):
        """
        Generate a visualization of tremor analysis results.
        
        Args:
            tremor_data (dict): Dictionary containing tremor analysis results
            
        Returns:
            plotly.graph_objects.Figure: Plotly figure object
        """
        if not tremor_data or 'tremor_score' not in tremor_data:
            return None
            
        # Create gauge chart for tremor severity
        fig = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = tremor_data['tremor_score'] * 100,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Tremor Severity", 'font': {'size': 20}},
            gauge = {
                'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
                'bar': {'color': "darkblue"},
                'bgcolor': "white",
                'borderwidth': 2,
                'bordercolor': "gray",
                'steps': [
                    {'range': [0, 30], 'color': 'lightgreen'},
                    {'range': [30, 70], 'color': 'yellow'},
                    {'range': [70, 100], 'color': 'red'}
                ],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': tremor_data['tremor_score'] * 100
                }
            }
        ))
        
        # Add custom text annotations
        fig.add_annotation(
            x=0.5, y=0.25,
            text=f"Severity: {tremor_data.get('severity', 'N/A')}",
            showarrow=False,
            font=dict(size=14)
        )
        
        fig.update_layout(
            height=400,
            margin=dict(l=50, r=50, t=50, b=50),
            paper_bgcolor="white"
        )
        
        return fig
    
    @staticmethod
    def plot_tap_analysis(tap_data):
        """
        Generate a visualization of tap test results.
        
        Args:
            tap_data (dict): Dictionary containing tap test results
            
        Returns:
            plotly.graph_objects.Figure: Plotly figure object
        """
        if not tap_data or 'bradykinesia_score' not in tap_data:
            return None
            
        # Create gauge chart for bradykinesia
        fig = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = tap_data['bradykinesia_score'] * 100,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Bradykinesia Severity", 'font': {'size': 20}},
            gauge = {
                'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
                'bar': {'color': "darkblue"},
                'bgcolor': "white",
                'borderwidth': 2,
                'bordercolor': "gray",
                'steps': [
                    {'range': [0, 30], 'color': 'lightgreen'},
                    {'range': [30, 70], 'color': 'yellow'},
                    {'range': [70, 100], 'color': 'red'}
                ],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': tap_data['bradykinesia_score'] * 100
                }
            }
        ))
        
        # Add tap metrics
        metrics = tap_data.get('tap_features', {})
        metrics_text = "<br>".join([
            f"Taps: {tap_data.get('tap_count', 0)}",
            f"Mean interval: {metrics.get('mean_interval', 0):.2f}s",
            f"Variability: {metrics.get('interval_variability', 0):.2f}",
            f"Amplitude: {metrics.get('amplitude', 0):.2f}"
        ])
        
        fig.add_annotation(
            x=0.5, y=0.2,
            text=metrics_text,
            showarrow=False,
            font=dict(size=12),
            align='center'
        )
        
        fig.update_layout(
            height=500,
            margin=dict(l=50, r=50, t=50, b=50),
            paper_bgcolor="white"
        )
        
        return fig
    
    @staticmethod
    def plot_risk_assessment(risk_data):
        """
        Generate a visualization of the overall risk assessment.
        
        Args:
            risk_data (dict): Dictionary containing risk assessment results
            
        Returns:
            plotly.graph_objects.Figure: Plotly figure object
        """
        if not risk_data:
            return None
            
        # Create a radar chart for component scores
        categories = ['Tremor', 'Bradykinesia', 'Demographics', 'Symptoms']
        values = [
            risk_data['component_scores']['tremor'] * 100,
            risk_data['component_scores']['bradykinesia'] * 100,
            risk_data['component_scores']['demographics'] * 100,
            risk_data['component_scores']['symptoms'] * 100
        ]
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatterpolar(
            r=values + values[:1],  # Close the shape
            theta=categories + categories[:1],
            fill='toself',
            name='Scores',
            line=dict(color='royalblue'),
            fillcolor='rgba(65, 105, 225, 0.5)'
        ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100],
                    tickfont=dict(size=10)
                )
            ),
            showlegend=False,
            title='Risk Assessment Components',
            title_x=0.5,
            height=500,
            margin=dict(l=50, r=50, t=50, b=50)
        )
        
        return fig
    
    @staticmethod
    def plot_risk_trend(historical_data):
        """
        Generate a line chart showing risk score trends over time.
        
        Args:
            historical_data (list): List of historical test results with timestamps
            
        Returns:
            plotly.graph_objects.Figure: Plotly figure object
        """
        if not historical_data or len(historical_data) < 2:
            return None
            
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        
        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['date'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('date')
            
            # Create figure
            fig = go.Figure()
            
            # Add risk score line
            fig.add_trace(go.Scatter(
                x=df['date'],
                y=df['risk_score'] * 100,
                mode='lines+markers',
                name='Risk Score',
                line=dict(color='royalblue', width=2),
                marker=dict(size=8)
            ))
            
            # Add threshold lines
            fig.add_hline(y=30, line_dash="dash", line_color="green", 
                         annotation_text="Low Risk", 
                         annotation_position="bottom right")
            fig.add_hline(y=60, line_dash="dash", line_color="orange", 
                         annotation_text="Moderate Risk", 
                         annotation_position="bottom right")
            fig.add_hline(y=80, line_dash="dash", line_color="red", 
                         annotation_text="High Risk", 
                         annotation_position="top right")
            
            # Update layout
            fig.update_layout(
                title='Risk Score Over Time',
                xaxis_title='Date',
                yaxis_title='Risk Score (%)',
                yaxis=dict(range=[0, 100]),
                showlegend=True,
                height=500,
                margin=dict(l=50, r=50, t=50, b=50)
            )
            
            return fig
            
        return None
    
    @staticmethod
    def plot_symptom_analysis(symptoms_data):
        """
        Generate a bar chart of symptom frequencies.
        
        Args:
            symptoms_data (dict): Dictionary containing symptom data
            
        Returns:
            plotly.graph_objects.Figure: Plotly figure object
        """
        if not symptoms_data:
            return None
            
        # Filter out non-symptom keys
        symptom_keys = [k for k in symptoms_data.keys() if k not in ['timestamp', 'test_type', 'user_id']]
        
        if not symptom_keys:
            return None
            
        # Count symptoms
        symptom_counts = {}
        for key in symptom_keys:
            if isinstance(symptoms_data[key], bool):
                if symptoms_data[key]:
                    symptom_counts[key.replace('_', ' ').title()] = 1
            elif symptoms_data[key] and symptoms_data[key] not in ['no', 'false', '0']:
                symptom_counts[key.replace('_', ' ').title()] = 1
                
        if not symptom_counts:
            return None
            
        # Create bar chart
        fig = go.Figure(go.Bar(
            x=list(symptom_counts.keys()),
            y=list(symptom_counts.values()),
            marker_color='indianred'
        ))
        
        fig.update_layout(
            title='Reported Symptoms',
            xaxis_title='Symptom',
            yaxis_title='Reported',
            yaxis=dict(range=[0, 1.5], showticklabels=False),
            height=400,
            margin=dict(l=50, r=50, t=50, b=100),
            xaxis_tickangle=-45
        )
        
        return fig
    
    @staticmethod
    def create_summary_card(title, value, description, color='primary'):
        """
        Create a summary card for dashboard display.
        
        Args:
            title (str): Card title
            value: Value to display
            description (str): Description text
            color (str): Color theme ('primary', 'success', 'warning', 'danger')
            
        Returns:
            str: HTML/CSS for the card
        """
        color_map = {
            'primary': '#4e73df',
            'success': '#1cc88a',
            'warning': '#f6c23e',
            'danger': '#e74a3b'
        }
        
        return f"""
        <div style="
            background: white;
            border-radius: 0.35rem;
            padding: 1.5rem;
            box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
            margin-bottom: 1.5rem;
            border-left: 0.25rem solid {color_map.get(color, '#4e73df')};
        ">
            <div style="
                text-transform: uppercase;
                font-size: 0.7rem;
                font-weight: 700;
                color: #4e73df;
                margin-bottom: 0.25rem;
            ">
                {title}
            </div>
            <div style="
                font-size: 1.5rem;
                font-weight: 700;
                color: #5a5c69;
            ">
                {value}
            </div>
            <div style="
                font-size: 0.8rem;
                color: #858796;
                margin-top: 0.5rem;
            ">
                {description}
            </div>
        </div>
        """
