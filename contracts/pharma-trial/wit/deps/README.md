# Vendored host interface dependencies
#
# These directories should contain the WIT package files vendored from the
# T3N target cluster. The versions must match what the cluster provides.
#
# To vendor deps, run:
#   wit-deps vendor --target <cluster-url> --output wit/deps
#
# Expected structure:
#   wit/deps/host-tenant-1.0.0/
#   wit/deps/host-interfaces-2.1.0/
#
# For the hackathon, you can use the sample deps from the reference repo:
#   https://github.com/Terminal-3/z-tenant-flight/tree/main/wit/deps
