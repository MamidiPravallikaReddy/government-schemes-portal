from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
import logging
from pathlib import Path
import re

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemeRecommender:
    def __init__(self):
        logger.info("=" * 60)
        logger.info("Loading Government Schemes ML Model...")
        logger.info("=" * 60)
        
        base_dir = Path(__file__).parent
        data_dir = base_dir / 'data'
        
        # Load the dataset
        csv_path = data_dir / 'updated_data.csv'
        if csv_path.exists():
            logger.info(f"Loading dataset from: {csv_path}")
            self.df = pd.read_csv(csv_path)
            self.df = self.df.fillna('')
            logger.info(f"✅ Loaded {len(self.df)} schemes")
            logger.info(f"Columns: {list(self.df.columns)}")
            
            # Process categories
            if 'schemeCategory' in self.df.columns:
                # Split multiple categories (like "Agriculture,Rural & Environment, Social welfare & Empowerment")
                all_categories = []
                for cat in self.df['schemeCategory']:
                    if cat and cat != '':
                        # Split by comma and strip whitespace
                        cats = [c.strip() for c in str(cat).split(',')]
                        all_categories.extend(cats)
                
                # Count categories
                from collections import Counter
                category_counts = Counter(all_categories)
                self.categories = [{'name': name, 'count': count} for name, count in category_counts.most_common()]
                logger.info(f"✅ Found {len(self.categories)} unique categories")
                for cat in self.categories[:15]:
                    logger.info(f"   - {cat['name']}: {cat['count']} schemes")
        else:
            logger.error(f"Dataset not found at {csv_path}")
            self.df = self.create_sample_data()
            self.categories = []
        
        # Prepare text for embeddings
        self.df['text'] = (
            self.df['scheme_name'].astype(str) + " " +
            self.df['details'].astype(str) + " " +
            self.df['benefits'].astype(str) + " " +
            self.df['eligibility'].astype(str) + " " +
            self.df['schemeCategory'].fillna('').astype(str)
        )
        
        # Load sentence transformer model
        logger.info("Loading Sentence Transformer model...")
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # Load or compute embeddings
        embeddings_path = data_dir / 'embeddings.pkl'
        if embeddings_path.exists():
            logger.info(f"Loading embeddings from: {embeddings_path}")
            with open(embeddings_path, 'rb') as f:
                self.embeddings = pickle.load(f)
        else:
            logger.info("Computing embeddings (this may take a few minutes)...")
            self.embeddings = self.model.encode(self.df['text'].tolist(), show_progress_bar=True)
            with open(embeddings_path, 'wb') as f:
                pickle.dump(self.embeddings, f)
            logger.info("✅ Embeddings saved")
        
        logger.info(f"✅ Ready with {len(self.df)} schemes")
        logger.info("=" * 60)
    
    def create_sample_data(self):
        return pd.DataFrame({
            'scheme_name': ['PM-KISAN', 'Scholarship Scheme', 'Health Scheme'],
            'details': ['Farmer support', 'Student aid', 'Medical help'],
            'benefits': ['₹6000/year', 'Up to ₹50000', 'Free treatment'],
            'eligibility': ['Farmers', 'Students', 'BPL families'],
            'schemeCategory': ['Agriculture', 'Education', 'Health']
        })
    
    def get_all_categories(self):
        """Get all unique categories with counts"""
        return self.categories
    
    def get_schemes_by_category(self, category_name, limit=100):
        """Get all schemes for a specific category"""
        if 'schemeCategory' not in self.df.columns:
            return []
        
        # Filter schemes where category contains the selected category
        mask = self.df['schemeCategory'].str.contains(category_name, case=False, na=False)
        filtered = self.df[mask]
        
        results = []
        for _, row in filtered.head(limit).iterrows():
            results.append({
                'scheme_name': str(row['scheme_name']),
                'description': str(row['details'][:300]) if pd.notna(row['details']) else '',
                'benefits': str(row['benefits'][:200]) if pd.notna(row['benefits']) else '',
                'eligibility': str(row['eligibility'][:200]) if pd.notna(row['eligibility']) else '',
                'category': str(row['schemeCategory']) if pd.notna(row['schemeCategory']) else '',
                'level': str(row['level']) if 'level' in row and pd.notna(row['level']) else 'Central/State'
            })
        return results
    
    def search(self, query, top_k=10, threshold=0.1):
        """Search for similar schemes"""
        try:
            query_vec = self.model.encode([query])
            scores = cosine_similarity(query_vec, self.embeddings)[0]
            top_indices = scores.argsort()[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if scores[idx] >= threshold:
                    results.append({
                        'scheme_name': str(self.df.iloc[idx]['scheme_name']),
                        'description': str(self.df.iloc[idx]['details'][:300]) if pd.notna(self.df.iloc[idx]['details']) else '',
                        'benefits': str(self.df.iloc[idx]['benefits'][:200]) if pd.notna(self.df.iloc[idx]['benefits']) else '',
                        'eligibility': str(self.df.iloc[idx]['eligibility'][:200]) if pd.notna(self.df.iloc[idx]['eligibility']) else '',
                        'category': str(self.df.iloc[idx]['schemeCategory']) if 'schemeCategory' in self.df.columns else '',
                        'similarity_score': float(scores[idx])
                    })
            return results
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return []
    
    def get_all_schemes(self, page=1, per_page=20):
        """Get all schemes with pagination"""
        start = (page - 1) * per_page
        end = start + per_page
        
        schemes = []
        for _, row in self.df.iloc[start:end].iterrows():
            schemes.append({
                'scheme_name': str(row['scheme_name']),
                'description': str(row['details'][:200]) if pd.notna(row['details']) else '',
                'benefits': str(row['benefits'][:100]) if pd.notna(row['benefits']) else '',
                'eligibility': str(row['eligibility'][:100]) if pd.notna(row['eligibility']) else '',
                'category': str(row['schemeCategory']) if 'schemeCategory' in self.df.columns else ''
            })
        return schemes, len(self.df)

# Initialize recommender
recommender = SchemeRecommender()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'schemes_loaded': len(recommender.df),
        'categories': len(recommender.get_all_categories())
    })

@app.route('/categories', methods=['GET'])
def get_categories():
    categories = recommender.get_all_categories()
    return jsonify({
        'success': True,
        'categories': categories,
        'count': len(categories)
    })

@app.route('/schemes/category/<category>', methods=['GET'])
def get_schemes_by_category(category):
    limit = request.args.get('limit', 100, type=int)
    schemes = recommender.get_schemes_by_category(category, limit)
    return jsonify({
        'success': True,
        'category': category,
        'schemes': schemes,
        'count': len(schemes)
    })

@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.json
        query = data.get('query', '')
        top_k = data.get('top_k', 10)
        threshold = data.get('threshold', 0.1)
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        logger.info(f"Searching: '{query}'")
        results = recommender.search(query, top_k, threshold)
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'count': len(results)
        })
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/schemes/all', methods=['GET'])
def get_all_schemes():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    schemes, total = recommender.get_all_schemes(page, per_page)
    
    return jsonify({
        'success': True,
        'schemes': schemes,
        'total': total,
        'page': page,
        'per_page': per_page
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting ML Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
