const reportInvalidIndex = (a: any[], idx: number) => new Error(`index ${idx} out of bounds for array of length ${a.length}`);

export const assumeIndex = <T>(a: T[], idx: number): T => {
    if (a.length <= idx) fail(reportInvalidIndex(a, idx));
    return a[idx];
}
