# The HackOHI/O Wall

Every name on [the wall](https://mat43.github.io/hackohio-wall/) got there through a pull request.

## Add yourself

1. **Fork** this repo.
2. `git clone https://github.com/<you>/hackohio-wall.git` and `cd hackohio-wall`
3. `git switch -c add-<your-username>`
4. Create `attendees/<your-username>.json`:
   ```json
   {
     "name": "Your Name",
     "building": "what you're hacking on this weekend",
     "site": "https://<your-username>.github.io/hackohio-site"
   }
   ```
5. `git add .`, `git commit -m "Add <your-username> to the wall"`, `git push -u origin add-<your-username>`
6. On GitHub: **Compare & pull request** → **Create pull request**. A check makes sure your file is valid. Don't merge it yourself.

## For presenters

- `scripts/merge-ready.sh` squash-merges every PR with a green check (needs `gh`). Run it again for stragglers.
- Each merge to `main` rebuilds and deploys the page; the wall polls for new names every 15 seconds.
- Rehearse with fake data: `?demo=30` for a full wall, `?demo=live` to add one every 3 seconds.
