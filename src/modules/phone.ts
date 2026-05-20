const CN: Record<string, { carrier: string }> = {
  "134":{carrier:"CMCC"},"135":{carrier:"CMCC"},"136":{carrier:"CMCC"},"137":{carrier:"CMCC"},"138":{carrier:"CMCC"},"139":{carrier:"CMCC"},"147":{carrier:"CMCC"},"148":{carrier:"CMCC"},"150":{carrier:"CMCC"},"151":{carrier:"CMCC"},"152":{carrier:"CMCC"},"157":{carrier:"CMCC"},"158":{carrier:"CMCC"},"159":{carrier:"CMCC"},"172":{carrier:"CMCC"},"178":{carrier:"CMCC"},"182":{carrier:"CMCC"},"183":{carrier:"CMCC"},"184":{carrier:"CMCC"},"187":{carrier:"CMCC"},"188":{carrier:"CMCC"},"198":{carrier:"CMCC"},
  "130":{carrier:"CUCC"},"131":{carrier:"CUCC"},"132":{carrier:"CUCC"},"145":{carrier:"CUCC"},"146":{carrier:"CUCC"},"155":{carrier:"CUCC"},"156":{carrier:"CUCC"},"166":{carrier:"CUCC"},"171":{carrier:"CUCC"},"175":{carrier:"CUCC"},"176":{carrier:"CUCC"},"185":{carrier:"CUCC"},"186":{carrier:"CUCC"},
  "133":{carrier:"CTCC"},"149":{carrier:"CTCC"},"153":{carrier:"CTCC"},"173":{carrier:"CTCC"},"174":{carrier:"CTCC"},"177":{carrier:"CTCC"},"180":{carrier:"CTCC"},"181":{carrier:"CTCC"},"189":{carrier:"CTCC"},"191":{carrier:"CTCC"},"199":{carrier:"CTCC"},"192":{carrier:"CBN"},
};

export function phoneIntel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return { valid: false, reason: "too_short" };
  let country = "unknown", carrier = "unknown";
  if ((digits.startsWith("86") && digits.length === 13) || digits.length === 11) {
    country = "China";
    const prefix = digits.startsWith("86") ? digits.slice(2, 5) : digits.slice(0, 3);
    if (CN[prefix]) carrier = CN[prefix].carrier;
  }
  return { valid: true, country, carrier, formatted: digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3"), length: digits.length };
}