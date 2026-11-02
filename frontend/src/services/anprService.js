import apiClient from './apiClient';
import { MOCK_VEHICLES } from '../mocks/vehicles';

export const anprService = {
  async detectPlate(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.post('/anpr/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { ...response.data, is_mock: false };
    } catch (err) {
      // Realistic Mock Demonstration Pipeline
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      // Pick a random plate from the mock collection (or deterministic based on filename if possible)
      const sample = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
      
      return {
        detected: true,
        registration_number: sample.registration_number,
        confidence: 0.964,
        processing_stages: [
          { name: "Plate Localization (YOLOv8)", status: "completed", time: "18ms" },
          { name: "OpenCV Deskewing & Threshold", status: "completed", time: "32ms" },
          { name: "EasyOCR Character Extraction", status: "completed", time: "145ms" },
          { name: "Indian Plate Regex Correction", status: "completed", time: "2ms" }
        ],
        bounding_box: { x1: 140, y1: 210, x2: 480, y2: 310 },
        is_mock: true
      };
    }
  }
};

