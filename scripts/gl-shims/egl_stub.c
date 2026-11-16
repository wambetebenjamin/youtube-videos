/* Minimal libEGL stub: reports "no EGL extensions" so Skia falls back to CPU raster. */
const char *eglQueryString(void *dpy, int name) { (void)dpy; (void)name; return 0; }
void *eglGetCurrentContext(void) { return 0; }
void *eglGetDisplay(void *native) { (void)native; return 0; }
int eglGetError(void) { return 0x3001; }
