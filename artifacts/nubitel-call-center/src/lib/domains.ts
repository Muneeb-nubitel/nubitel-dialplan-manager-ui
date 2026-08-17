export const availableDomains = [
  {
    value: 'cxdev.nubitel.io',
    label: 'cxdev.nubitel.io',
    uuid: 'cfd04d74-a94a-4659-92d2-f23653f75197',
  },
  {
    value: 'testdevb.com',
    label: 'testdevb.com',
    uuid: '756ae60c-880f-4bd9-81a6-c2cca97c130d',
  },
  {
    value: 'cx.nubitel.io',
    label: 'cx.nubitel.io',
    uuid: 'a6ca6cf5-7058-444b-abc5-6300c4b03ec6',
  },
] as const;

export const defaultDomain = availableDomains[0].value;

export function getSelectedDomain() {
  const storedDomain = localStorage.getItem('nubitel-domain');
  return availableDomains.some(({ value }) => value === storedDomain)
    ? storedDomain!
    : defaultDomain;
}
