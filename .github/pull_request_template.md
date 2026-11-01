## Pull Request

### What does this PR do?
<!-- Describe your changes clearly -->

### Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Security fix

### Security checklist (for all PRs)
- [ ] No secrets, API keys, or passwords committed
- [ ] User input is validated with express-validator
- [ ] No raw SQL queries (use Prisma parameterized queries)
- [ ] New endpoints have proper authentication middleware
- [ ] Admin-only endpoints are protected with `authorize('ADMIN')`
- [ ] File upload endpoints limit type and size
- [ ] Error messages don't expose internal stack traces in production

### Testing
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Manually tested in development

### Screenshots (if UI changes)
<!-- Add screenshots for any visual changes -->
