/**
 * S3 업로드 placeholder
 *
 * 추후 @aws-sdk/client-s3 로 구현.
 * 디자인 미리보기, 업로드 이미지 저장에 사용.
 */

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadToS3(
  _file: File | Blob,
  _key: string,
): Promise<UploadResult> {
  throw new Error("S3 업로드는 아직 구현되지 않았습니다.");
}

export async function getSignedUrl(_key: string): Promise<string> {
  throw new Error("S3 signed URL은 아직 구현되지 않았습니다.");
}
