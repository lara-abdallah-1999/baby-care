import type { Baby, MotherAdmission } from "../types";
export const motherFullName = (mother: MotherAdmission) =>
  mother.middleName ? mother.name.replace(/ (\S+)$/, ` ${mother.middleName} $1`) : mother.name;
export const babyFullName = (baby: Baby) =>
  [baby.firstName, baby.middleName, baby.lastName].filter(Boolean).join(" ") || baby.identifier;
