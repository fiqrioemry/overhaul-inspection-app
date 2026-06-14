# FEATURE IMPROVEMENT LIST.

- first try to understand the current database schema design, does it support multi rbac and for permission based access control.

- if the database does not support then add permission table, because if im not mistaken, i reviewed and found that permission is hard coded in backend code. if it supposed to be true then database design should be updated and create seeder for permission master data

- add endpoint to handle user permissions (revoke or grant). add business validation, for example super_admin cannot revoke himself or grant himself, super_admin cannot revoke permission to super_admin. the rest please add by yourself.

- endpoint get users must return which role can grant or revoke permission to, for example super_admin can revoke or grant permission to user, admin, inspector but cannot revoke to super_admin. the rest please add by your self.

- endpoint get users also must return permissions list of each user, also the access level to update (make it easier for frontend managing UI/UX).

- check all controller for every modules. update the response message using constant variable to make easier frontend implementing i8next / multi language
