import server from '../environment';

const API_BASE_URL = `${server}/api/v1/users`;

// Delete a single meeting from history by code
export const deleteMeeting = async (meetingCode) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/delete_meeting/${meetingCode}?token=${token}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete meeting');
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
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/delete_all_meetings?token=${token}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete all meetings');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting all meetings:', error);
    throw error;
  }
};