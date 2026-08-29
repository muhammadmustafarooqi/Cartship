import ImageKit from "imagekit";

export function isPlaceholderCredential(value?: string) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v === "demo" ||
    v === "your-public-key" ||
    v === "your-private-key" ||
    v === "your-url-endpoint"
  );
}

export function getImageKitConfig() {
  const publicKey = (
    process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
  )?.trim();
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = (
    process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  )?.trim();

  if (!publicKey || !privateKey || !urlEndpoint) return null;
  if (
    isPlaceholderCredential(publicKey) ||
    isPlaceholderCredential(privateKey) ||
    isPlaceholderCredential(urlEndpoint)
  ) {
    return null;
  }

  return { publicKey, privateKey, urlEndpoint };
}

let imagekitInstance: ImageKit | null = null;

export function getImageKit(): ImageKit {
  const config = getImageKitConfig();
  if (!config) {
    throw new Error("IMAGEKIT_NOT_CONFIGURED");
  }

  if (!imagekitInstance) {
    imagekitInstance = new ImageKit(config);
  }
  return imagekitInstance;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  mimeType: string,
  folder: string = "/cartship",
  fileName?: string
): Promise<{ url: string; fileId: string; name: string; filePath: string }> {
  const imagekit = getImageKit();
  const generatedFileName =
    fileName || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const response = await imagekit.upload({
    file: buffer.toString("base64"),
    fileName: generatedFileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    url: response.url,
    fileId: response.fileId,
    name: response.name,
    filePath: response.filePath,
  };
}

export function isAllowedReviewImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "ik.imagekit.io" ||
        parsed.hostname === "res.cloudinary.com" ||
        parsed.hostname === "images.unsplash.com")
    );
  } catch {
    return false;
  }
}
