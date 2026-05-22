# Output Formats — Extended Reference

## Additional Format Options

| Format | Use case |
|--------|---------|
| `-o json` | Full field set — recommended default |
| `-o table` | Quick human-readable overview |
| `-o csv=field1,field2` | Specific field extraction |
| `-o expr='{field1},{field2}\n'` | Custom text format per record |
| `-o json-properties` | List all queryable property names for a command — useful for discovering available filter fields |
| `--fetch=1 -o json` | Sample a single record from the server to inspect actual field names and values — faster than downloading a full page (available on most `list` commands) |

## JSON Processing

**Preferred approach**: Run commands with `-o json` and parse the JSON output directly in your reasoning — you are the JSON processor. This is the most portable approach and avoids dependency on external tools.

When you need to extract values for use in a follow-up terminal command (e.g., extracting IDs from a list to pass to an update), write a small inline script using the language runtime available in the user's environment. Python is widely available on both Linux/Mac and Windows:
```bash
fcli <product> <list-command> --query "..." -o json | \
  python -c "import sys,json; print(','.join(str(i['<id-field>']) for i in json.load(sys.stdin)))"
```

Replace `<id-field>` with the actual field name for the object type (e.g., `vulnId` for FoD issues, `id` for SSC issues). If `python` is not on PATH, try `python3`.

For simple field extraction without scripting, use fcli's built-in formats:
```bash
fcli <product> <list-command> -o csv=<field>                    # single field
fcli <product> <list-command> -o expr='{field1},{field2}\n'     # custom format per record
```

For `--query` SpEL syntax, null-safety patterns, `--style` options, and `--store` variable chaining, see `references/fcli-query-output.md`.
