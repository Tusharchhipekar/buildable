export type GoogleProfile = {
  id: string;
  displayName: string;
  emails: { value: string; verified?: boolean }[];
  photos: { value: string }[];
};

export type RegisterBody = {
  email: string;
  password: string;
  name?: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AuthResponseBody = {
  id: string;
  email: string;
  name?: string;
};

export type ErrorResponseBody = {
  error: string;
};
