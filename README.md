<div align="center">
  <img src="assets/brifter-logo.avif" alt="Brifter logo" width="150" height="150">
</div>

Brifter.js is a small script to build web page with simple in mind. Brifter is mechanical component in a cycling world to shift the gears. It's simple and easy to use, just one sway/click/tap, gear shifted and we aim to take inspiration from it.

![Brifter shifting](assets/brifter-shifting.avif)

here's a brifter works : 

```
<form 
  action="/submit" 
  method="POST" 
  data-shift-lever="swap" 
  data-shift-target="#content" 
  data-shift-loading="#loading"
>
  <input type="text" name="username" required>
  <button type="submit">Submit</button>
</form>
```

use `data-shift-lever` attribute and fill it with either `swap`, `append` or `prepend`. The web server should only return HTML, not JSON. the `data-shift-target` is the target where the response should live. if you have loading id element, add it to `data-shift-loading` so it will show loading when the request is in progress.

![Brifter Derailleur](assets/brifter-derailleur.avif)

The Brifter needs a pair match Derailleur. To use `brifter.js` you need a web server that return a HTML instead of JSON. There's so many benefit of doing this, e.g smaller js assets, no business code duplication in BE and FE, just one source of truth.

![Brifter Feedback](assets/brifter-feedback.avif)

Any interaction ideally should have a feedback to user, you can put your snackbar message content to `X-Feedback-Header` in the header response.