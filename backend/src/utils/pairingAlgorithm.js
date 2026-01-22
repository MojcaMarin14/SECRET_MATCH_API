const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const assignPairs = (participants) => {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for pairing');
  }
  
  const shuffled = shuffleArray(participants);
  const pairs = [];
  
  // Ciklično parjenje
  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    const receiver = shuffled[(i + 1) % shuffled.length];
    
    // Preveri, da ni samo-parjenja
    if (giver.toString() === receiver.toString()) {
      // Če pride do samo-parjenja, premešaj znova
      return assignPairs(participants);
    }
    
    pairs.push({ giver, receiver });
  }
  
  return pairs;
};

module.exports = { assignPairs, shuffleArray };