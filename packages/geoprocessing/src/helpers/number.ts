/** Rounds a number to a fixed precision  */
export const roundDecimal = (value: number, decimals = 1) => {
  return Number(
    Math.round(parseFloat(`${value}e${decimals}`)) + `e-${decimals}`
  );
};

/** Formats number value as percent string with special handling of minimum bound */
export const percentLower = (
  val: number,
  options: { lower: number; digits: number; lowerOverride?: string } = {
    lower: 0.001,
    digits: 1,
  }
) => {
  const { lower, digits, lowerOverride } = options;

  const PercentFormatter = new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: digits,
  });

  if (val < lower) {
    if (lowerOverride) {
      return `${lowerOverride}`;
    } else {
      return `< ${PercentFormatter.format(lower)}`;
    }
  } else {
    return PercentFormatter.format(val);
  }
};

/** Formats number to string, rounding decimal to number of digits, with special handling of minimum bound */
export const roundLower = (val: number, { lower } = { lower: 1 }) => {
  const NumberFormatter = new Intl.NumberFormat("en", { style: "decimal" });

  return val < lower
    ? `< ${lower}`
    : NumberFormatter.format(roundDecimal(val, 1));
};
