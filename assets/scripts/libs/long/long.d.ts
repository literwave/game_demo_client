/** long.js 4.0.0 (Apache-2.0). Only the API used by the protocol boundary. */
declare const Long: {
    fromValue(value: any, unsigned?: boolean): { toString(): string; toNumber(): number; low: number; high: number; unsigned: boolean };
};
export default Long;
