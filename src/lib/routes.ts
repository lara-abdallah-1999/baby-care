/** Route presentation metadata shared by the application chrome. */
const pageDetails: Record<string, { title: string; mainClass: string }> = {
  "/": { title: "Dashboard", mainClass: "overview-main" },
  "/admission": {
    title: "Newborn Registration and Lab Requests",
    mainClass: "record-main",
  },
  "/lab-request-register": { title: "Lab Requests Register", mainClass: "register-main" },
  "/lab-requests": { title: "Lab requests", mainClass: "standard-main" },
  "/request-proceeded": { title: "Request Proceeded", mainClass: "standard-main" },
  "/baby-admissions": { title: "Baby Admissions", mainClass: "register-main" },
  "/newborn-records": { title: "Newborn Records", mainClass: "register-main" },
};

export function getPageDetails(pathname: string) {
  return pageDetails[pathname] ?? { title: "Dashboard", mainClass: "standard-main" };
}
