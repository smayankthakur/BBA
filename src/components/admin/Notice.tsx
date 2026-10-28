const OK: Record<string, string> = {
  saved: "Saved. The website updates on its next visit.",
  created: "Created. The website updates on its next visit.",
  trash: "Moved to the trash.",
  published: "Restored and published.",
  draft: "Moved to drafts.",
  delete: "Deleted permanently.",
  deleted: "Deleted.",
  reset: "Back to the original text.",
  revoked: "Invite cancelled.",
  updated: "Updated.",
  on: "Coupon switched on.",
  pon: "Partner link switched on.",
  poff: "Partner link switched off. Visits through it are no longer credited.",
  payout: "Payout recorded.",
  off: "Coupon switched off. Customers can't use it until you switch it back on.",
};
const ERR: Record<string, string> = {
  title: "Please give it a title.",
  slug: "The web address can only use lowercase letters, numbers and dashes.",
  slugTaken: "Another product already uses that web address.",
  price: "Enter a price between ₹1 and ₹10,00,000.",
  data: "Something went wrong reading the form. Please try again.",
  missing: "That item no longer exists.",
  notTrash: "Move it to the trash first.",
  inUse:
    "That image is still used on the site. Remove it from the product or page first.",
  email: "Please enter a valid email address.",
  taken: "Someone with that email already has an account.",
  self: "You can't change your own account here. Use My account.",
  owner: "The owner account can't be changed here.",
  current: "Your current password is not correct.",
  weak: "Use a password of at least 10 characters with letters and numbers.",
  mismatch: "The two new passwords don't match.",
  confirm: "Tick the box to confirm.",
  status: "Choose a valid status.",
  code: "Coupon codes are 3–24 letters or numbers (dashes and underscores allowed), no spaces.",
  codeTaken: "Another coupon already uses that code.",
  value: "Enter a discount: 1–90% or ₹1 and up.",
  dates: "The end date must be on or after the start date.",
  limits: "Limits must be whole numbers of 1 or more (or leave them empty).",
  name: "Please enter a name.",
  pcode: "Link codes are 2–31 lowercase letters, numbers or dashes, e.g. priya or yoga-studio.",
  pcodeTaken: "Another partner already uses that link code.",
  rate: "Commission must be 0–90% or a rupee amount.",
  amount: "Enter the amount paid (at least ₹1).",
  paidOn: "Choose the date it was paid.",
  dob: "Check the date of birth (it can't be in the future).",
  mobile: "Enter a 10-digit Indian mobile number.",
  pincode: "Enter a 6-digit PIN code.",
  state: "Choose a state from the list.",
};

/** Green/red message at the top of an admin screen, from ?msg= or ?err=. */
export default function Notice({
  sp,
}: {
  sp: Record<string, string | undefined>;
}) {
  if (sp.err && ERR[sp.err])
    return (
      <div className="ad-notice is-err" role="alert">
        <p>{ERR[sp.err]}</p>
      </div>
    );
  if (sp.msg && OK[sp.msg])
    return (
      <div className="ad-notice" role="status">
        <p>{OK[sp.msg]}</p>
      </div>
    );
  return null;
}
