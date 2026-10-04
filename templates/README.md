# templates/

Projects with no clip bound yet — a design you intend to reuse.

Create one by saving a project with `source.clip: null`, then stamp it onto footage:

```bash
npm run batch -- --template my-design --clips "media/source/*.mp4" --quotes stoic --render
```
