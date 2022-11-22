"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isValidData(name, price) {
    if (typeof name !== 'string' || typeof price !== 'number')
        return false;
    return true;
}
exports.default = isValidData;
//# sourceMappingURL=validation.js.map