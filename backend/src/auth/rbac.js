/**
 * Role-Based Access Control Middleware
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthorized: No user information' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }

        next();
    };
}

module.exports = {
    requireRole,
    ROLES: {
        ADMIN: 'ADMIN',
        SUPERVISOR: 'SUPERVISOR',
        SUBJECT_EXPERT: 'SUBJECT_EXPERT',
        SCRUTINY_OFFICER: 'SCRUTINY_OFFICER',
        EXAM_CENTRE: 'EXAM_CENTRE',
        AUDITOR: 'AUDITOR',
        STUDENT: 'STUDENT'
    }
};
