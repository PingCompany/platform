"""
Startup patch: read NEO4J_DATABASE from environment and configure the Graphiti
Neo4j driver to use it instead of the hardcoded default ("neo4j").

This runs as a monkeypatch at import time via Dockerfile COPY + sitecustomize.
Once https://github.com/getzep/graphiti/issues/715 is resolved upstream,
this file can be removed.
"""

import os

_neo4j_database = os.environ.get("NEO4J_DATABASE")

if _neo4j_database:
    from graphiti_core.driver.neo4j_driver import Neo4jDriver

    _original_init = Neo4jDriver.__init__

    def _patched_init(self, uri, user=None, password=None):
        """Patch Neo4jDriver to pass database= to the underlying AsyncGraphDatabase.driver()."""
        # Skip the original __init__ and do it ourselves with the database param
        from neo4j import AsyncGraphDatabase

        # Call GraphDriver.__init__ (the parent)
        super(Neo4jDriver, self).__init__()
        self.client = AsyncGraphDatabase.driver(
            uri=uri,
            auth=(user or "", password or ""),
            database=_neo4j_database,
        )

    Neo4jDriver.__init__ = _patched_init
