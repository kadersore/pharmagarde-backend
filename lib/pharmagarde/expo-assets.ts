import { Asset } from "expo-asset";
import Constants from "expo-constants";
import * as Font from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const MANUS_HOST_SUFFIX = ".manus.computer";
let patchInstalled = false;
let iconFontPromise: Promise<void> | null = null;

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/^exps?:\/\//, "").replace(/\/$/, "");
}

function getBrowserOrigin() {
  if (typeof globalThis === "undefined" || !("location" in globalThis)) return null;

  const origin = globalThis.location?.origin;
  if (!origin || origin === "null") return null;

  return origin.replace(/\/$/, "");
}

function getConfiguredAssetOrigin() {
  const browserOrigin = getBrowserOrigin();
  if (browserOrigin) {
    return browserOrigin;
  }

  const packagerProxyUrl = process.env.EXPO_PACKAGER_PROXY_URL;
  if (packagerProxyUrl && /^https?:\/\//.test(packagerProxyUrl)) {
    return packagerProxyUrl.replace(/\/$/, "");
  }

  const nativePackagerHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  if (nativePackagerHost) {
    const host = stripProtocol(nativePackagerHost);
    return host.includes(":") ? `http://${host}` : `https://${host}`;
  }

  const expoHostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (expoHostUri) {
    const host = stripProtocol(expoHostUri);
    const protocol = host.includes(MANUS_HOST_SUFFIX) ? "https" : "http";
    return `${protocol}://${host}`;
  }

  return "http://localhost:8081";
}

export function normalizeExpoAssetUri(uri: string | null | undefined) {
  if (!uri) return uri;

  const configuredOrigin = getConfiguredAssetOrigin();

  if (uri.startsWith("/")) {
    return `${configuredOrigin}${uri}`;
  }

  try {
    const parsed = new URL(uri);
    const hostLooksInvalid = parsed.hostname === "8081" || parsed.hostname === "";
    const isLoopbackWithoutExplicitHost = parsed.host === "8081";

    if (hostLooksInvalid || isLoopbackWithoutExplicitHost) {
      const configured = new URL(configuredOrigin);
      parsed.protocol = configured.protocol;
      parsed.hostname = configured.hostname;
      parsed.port = configured.port;
      return parsed.toString();
    }

    return uri;
  } catch {
    return uri;
  }
}

export function installExpoAssetUriFix() {
  if (patchInstalled) return;
  patchInstalled = true;

  const originalDownloadAsync = Asset.prototype.downloadAsync;

  Asset.prototype.downloadAsync = async function patchedDownloadAsync() {
    const mutableAsset = this as Asset & { uri: string };
    mutableAsset.uri = normalizeExpoAssetUri(mutableAsset.uri) ?? mutableAsset.uri;
    return originalDownloadAsync.call(this);
  };
}

export function preloadLocalIconAssets() {
  installExpoAssetUriFix();

  if (!iconFontPromise) {
    iconFontPromise = Font.loadAsync(MaterialIcons.font).then(() => undefined);
  }

  return iconFontPromise;
}
