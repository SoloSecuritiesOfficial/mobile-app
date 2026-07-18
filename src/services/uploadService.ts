import * as ImagePicker from "expo-image-picker";
import api from "./api";

export const pickProfileImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Gallery permission denied");
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

export const uploadProfileImage = async (
  image: ImagePicker.ImagePickerAsset
) => {
  const formData = new FormData();

  formData.append("image", {
    uri: image.uri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as any);

  const response = await api.post(
    "/user/upload-profile",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};