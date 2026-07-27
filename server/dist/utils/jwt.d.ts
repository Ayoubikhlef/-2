export declare function signAccessToken(payload: {
    userId: string;
    role: string;
}): string;
export declare function signRefreshToken(payload: {
    userId: string;
}): string;
export declare function verifyAccessToken(token: string): {
    userId: string;
    role: string;
};
export declare function verifyRefreshToken(token: string): {
    userId: string;
};
//# sourceMappingURL=jwt.d.ts.map