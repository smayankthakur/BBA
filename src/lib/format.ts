export const formatINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
