These ESM adapter modules expose configuration that is loaded separately from
the application bundle. The classic script tags in `../../index.html` assign
the corresponding global variables before the main application module starts.

The adapters deliberately fail during application startup if either runtime
configuration file is missing or loaded out of order.
