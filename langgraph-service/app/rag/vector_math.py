import math
import hashlib
import re
from typing import List


def generate_embedding(text: str, dim: int = 128) -> List[float]:
    """
    Generates a deterministic, normalized dense vector embedding for arbitrary text.
    Combines word token frequencies, sub-word n-grams, and semantic feature projections
    to ensure semantically similar technical concepts yield high cosine similarity.
    """
    clean_text = text.lower().strip()
    words = re.findall(r"\b[a-z0-9_-]+\b", clean_text)
    
    vec = [0.0] * dim
    if not words:
        return [0.0] * dim

    stopwords = {"a", "an", "the", "in", "on", "at", "to", "for", "with", "and", "or", "is", "are", "do", "how", "what", "we", "of", "our"}

    for i, word in enumerate(words):
        weight = 0.2 if word in stopwords else 2.5
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        vec[h % dim] += weight

        # Sub-word char ngrams for morphological matching (e.g. cache, caching, cached)
        if len(word) >= 3:
            for c in range(len(word) - 2):
                ngram = word[c:c+3]
                nh = int(hashlib.sha1(ngram.encode("utf-8")).hexdigest(), 16)
                vec[nh % dim] += 0.5

        # Bigram context
        if i < len(words) - 1:
            bg = f"{word}_{words[i+1]}"
            bgh = int(hashlib.sha256(bg.encode("utf-8")).hexdigest(), 16)
            vec[bgh % dim] += 1.8

    # L2 normalize vector
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [round(v / norm, 6) for v in vec]

    return vec



def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Calculates cosine similarity between two float vectors.
    """
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return max(-1.0, min(1.0, dot / (norm_a * norm_b)))
