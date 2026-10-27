import Image from "next/image";

export default function AuthLogo() {
  return (
    <div className="ad-auth-logo">
      <Image src="/brand/emblem.png" alt="" width={36} height={36} />
      <span>Bracelet By Ammit · Admin</span>
    </div>
  );
}
