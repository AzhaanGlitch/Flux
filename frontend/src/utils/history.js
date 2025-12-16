// src/utils/history.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; // Adjust as per your backend

// Delete a single meeting from history by code
export const deleteMeeting = async (meetingCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${meetingCode}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed, e.g., 'Authorization': `Bearer ${token}`
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete meeting');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

// Delete all meetings from history
export const deleteAllMeetings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed, e.g., 'Authorization': `Bearer ${token}`
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete all meetings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting all meetings:', error);
    throw error;
  }
};