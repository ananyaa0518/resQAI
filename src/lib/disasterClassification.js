// Simple keyword-based disaster classification
// In a real application, you would use a trained ML model

const disasterKeywords = {
  Flood: [
    'flood', 'flooding', 'water', 'rain', 'storm', 'overflow', 'drainage', 
    'submerged', 'inundated', 'water level', 'river', 'lake', 'pond'
  ],
  Fire: [
    'fire', 'burning', 'smoke', 'flame', 'blaze', 'ignition', 'combustion',
    'arson', 'explosion', 'gas leak', 'electrical fire', 'forest fire'
  ],
  Earthquake: [
    'earthquake', 'tremor', 'shake', 'seismic', 'ground', 'crack', 'fracture',
    'building collapse', 'structural damage', 'aftershock'
  ]
};

export function classifyDisaster(description) {
  const text = description.toLowerCase();
  const scores = {};
  
  // Calculate confidence scores for each disaster type
  Object.keys(disasterKeywords).forEach(type => {
    let score = 0;
    const keywords = disasterKeywords[type];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1;
      }
    });
    
    // Normalize score (0-1)
    scores[type] = Math.min(score / keywords.length, 1);
  });
  
  // Find the type with highest score
  const maxScore = Math.max(...Object.values(scores));
  const predictedType = Object.keys(scores).find(type => scores[type] === maxScore);
  
  // If no keywords match, classify as 'Other'
  if (maxScore === 0) {
    return {
      type: 'Other',
      confidence: 0.1
    };
  }
  
  return {
    type: predictedType,
    confidence: maxScore
  };
}

// Enhanced classification with context
export function enhancedClassification(description, location = null) {
  const basic = classifyDisaster(description);
  
  // Add location-based hints
  if (location) {
    const locationText = location.toLowerCase();
    
    // Water-related locations increase flood probability
    if (locationText.includes('river') || locationText.includes('lake') || 
        locationText.includes('coast') || locationText.includes('beach')) {
      if (basic.type === 'Flood') {
        basic.confidence = Math.min(basic.confidence + 0.2, 1);
      }
    }
    
    // Urban areas increase fire probability
    if (locationText.includes('building') || locationText.includes('city') || 
        locationText.includes('street') || locationText.includes('apartment')) {
      if (basic.type === 'Fire') {
        basic.confidence = Math.min(basic.confidence + 0.1, 1);
      }
    }
  }
  
  return basic;
}
