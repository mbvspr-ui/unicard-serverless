// Biometric authentication using Web Authentication API (WebAuthn)
// Supports fingerprint, face recognition, and other biometric methods

interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
}

const CREDENTIAL_KEY = 'admin_biometric_credential';

// Check if biometric authentication is available
export const isBiometricAvailable = async (): Promise<boolean> => {
  // Check if Web Authentication API is supported
  if (!window.PublicKeyCredential) {
    return false;
  }

  // Check if platform authenticator (fingerprint/face) is available
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Biometric check error:', error);
    return false;
  }
};

// Register biometric credential
export const registerBiometric = async (username: string): Promise<boolean> => {
  try {
    // Generate challenge (in production, this should come from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'UniCard Admin Portal',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (fingerprint/face)
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return false;
    }

    // Store credential info
    const credentialData: BiometricCredential = {
      id: credential.id,
      publicKey: arrayBufferToBase64(credential.rawId),
      counter: 0,
    };

    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credentialData));
    return true;
  } catch (error: any) {
    console.error('Biometric registration error:', error);
    
    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled or not allowed');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device');
    } else {
      throw new Error('Failed to register biometric authentication');
    }
  }
};

// Authenticate using biometric
export const authenticateWithBiometric = async (): Promise<boolean> => {
  try {
    // Get stored credential
    const storedCredential = localStorage.getItem(CREDENTIAL_KEY);
    if (!storedCredential) {
      throw new Error('No biometric credential found. Please register first.');
    }

    const credentialData: BiometricCredential = JSON.parse(storedCredential);

    // Generate challenge (in production, this should come from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create authentication options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: base64ToArrayBuffer(credentialData.publicKey),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      timeout: 60000,
      userVerification: 'required',
    };

    // Get credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return false;
    }

    // In production, you would verify the assertion on the server
    // For now, we just check if we got a valid response
    return true;
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    
    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled');
    } else if (error.message.includes('No biometric credential')) {
      throw error;
    } else {
      throw new Error('Biometric authentication failed');
    }
  }
};

// Check if biometric is registered
export const isBiometricRegistered = (): boolean => {
  return localStorage.getItem(CREDENTIAL_KEY) !== null;
};

// Remove biometric credential
export const removeBiometric = (): void => {
  localStorage.removeItem(CREDENTIAL_KEY);
};

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}