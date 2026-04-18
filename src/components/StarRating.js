import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const StarRating = ({ value, onChange, size = 24, disabled = false }) => {
  const stars = [1, 2, 3, 4, 5];

  const handleStarPress = (starValue) => {
    if (!disabled && onChange) {
      onChange(starValue);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          disabled={disabled}
          style={styles.starButton}
        >
          <Text
            style={[
              styles.star,
              {
                fontSize: size,
                color: star <= value ? '#ffd700' : '#888',
              },
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 2,
  },
  star: {
    fontWeight: 'bold',
  },
});

export default StarRating; 