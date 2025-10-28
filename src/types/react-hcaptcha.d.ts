declare module "react-hcaptcha" {
  import * as React from "react";
  export interface HCaptchaProps {
    sitekey: string;
    onVerify?: (token: string) => void;
    onError?: (err: unknown) => void;
    onExpire?: () => void;
    size?: "normal" | "compact" | "invisible";
    theme?: "light" | "dark";
  }
  const HCaptcha: React.FC<HCaptchaProps>;
  export default HCaptcha;
}
