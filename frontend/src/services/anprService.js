import apiClient from './apiClient';

export const anprService = {
  async detectPlate(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.post('/anpr/detect', formData, {
        headers: {
          'Content-Type': undefined, // Let browser / Axios auto-generate boundary
        },
      });
      return { ...response.data, is_mock: false };
    } catch (err) {
      console.warn("[ANPR] Live vision pipeline call issue:", err);
      const isNetworkError = !err.response;
      return {
        detected: false,
        registration_number: "",
        confidence: 0.0,
        processing_stages: [
          { name: "Plate Localization (YOLOv8)", status: "failed", time: "--" },
          { name: "OpenCV Deskewing & Threshold", status: "skipped", time: "--" },
          { name: "EasyOCR Character Extraction", status: "skipped", time: "--" },
          { name: "Indian Plate Regex Correction", status: "skipped", time: "--" }
        ],
        bounding_box: null,
        is_network_error: isNetworkError,
        error: isNetworkError
          ? "Backend connection failed. Please ensure FastAPI server is running on http://localhost:8000."
          : (err.response?.data?.detail || "No valid license plate detected in image."),
        is_mock: false
      };
    }
  }
};

