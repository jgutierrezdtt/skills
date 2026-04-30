## Use Case: Framework Function Identifiers

This reference provides the `className`, `functionName`, and `namespaceName` values needed for `<FunctionIdentifier>` blocks in DataflowSinkRule, DataflowSourceRule, and DataflowPassthroughRule definitions. Use it when authoring rules for specific frameworks to avoid guessing class or module names.

`<FunctionIdentifier>` tells the analyzer which function a rule applies to. Incorrect class or method names result in the rule silently producing no findings.

---

### Java — Spring Framework

| Rule purpose | className | functionName | notes |
|---|---|---|---|
| SQL injection (JPA `@Query`) | `org.springframework.data.jpa.repository.JpaRepository` | (annotation-based — use CharacterizationRule) | Match `@Query` annotation with structural predicate |
| XSS via `@ResponseBody` | (annotation-based) | (use StructuralRule or CharacterizationRule) | Match `@ResponseBody` annotation |
| CSRF check disabled | `org.springframework.security.config.annotation.web.builders.HttpSecurity` | `csrf` | Add sink at `.disable()` chain call |
| Redirect with user input | `org.springframework.web.servlet.view.RedirectView` | `RedirectView` | Constructor argument is the URL |
| Redirect with user input | `org.springframework.web.servlet.mvc.support.RedirectAttributes` | `addAttribute` | |
| Password encoded weak | `org.springframework.security.crypto.password.MessageDigestPasswordEncoder` | `encode` | Flag usage of MD5/SHA1 encoders |

**Spring source rules — HTTP request parameters:**

| className | functionName | taint output |
|---|---|---|
| `org.springframework.web.context.request.WebRequest` | `getParameter` | Return value |
| `org.springframework.web.context.request.WebRequest` | `getParameterValues` | Return value |
| `org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter` | (use CharacterizationRule with `@RequestParam` / `@PathVariable` annotation) | Annotated parameter |

---

### Java — Servlet / JEE

| Rule purpose | className | functionName |
|---|---|---|
| Taint source (HTTP param) | `javax.servlet.http.HttpServletRequest` | `getParameter` |
| Taint source (HTTP header) | `javax.servlet.http.HttpServletRequest` | `getHeader` |
| Taint source (cookie value) | `javax.servlet.http.Cookie` | `getValue` |
| Taint source (query string) | `javax.servlet.http.HttpServletRequest` | `getQueryString` |
| XSS sink (write to response) | `javax.servlet.http.HttpServletResponse` | `getWriter` — then track `print`/`println` |
| SQL sink | `java.sql.Statement` | `executeQuery`, `execute`, `executeUpdate` |
| SQL sink (prepared) | `java.sql.PreparedStatement` | `executeQuery`, `execute` |
| Command injection sink | `java.lang.Runtime` | `exec` |
| Command injection sink | `java.lang.ProcessBuilder` | `command` |
| Path manipulation sink | `java.io.FileInputStream` | `FileInputStream` |
| Path manipulation sink | `java.nio.file.Paths` | `get` |
| LDAP injection sink | `javax.naming.directory.DirContext` | `search` |
| Open redirect sink | `javax.servlet.http.HttpServletResponse` | `sendRedirect` |
| Session fixation | `javax.servlet.http.HttpSession` | `setAttribute` — after login without `invalidate` |

---

### C# / ASP.NET Core

| Rule purpose | namespace | className | functionName |
|---|---|---|---|
| SQL injection (EF raw) | `Microsoft.EntityFrameworkCore` | `RelationalDatabaseFacadeExtensions` | `ExecuteSqlRaw`, `ExecuteSqlInterpolated` |
| SQL injection (ADO.NET) | `System.Data.SqlClient` | `SqlCommand` | Constructor (first arg) |
| XSS via Razor | `Microsoft.AspNetCore.Mvc.Rendering` | `HtmlHelper` | `Raw` |
| HTTP param source | `Microsoft.AspNetCore.Http` | `HttpRequest` | `get_Query`, `get_Form` |
| Redirect | `Microsoft.AspNetCore.Mvc` | `Controller` | `Redirect` |
| Command injection | `System.Diagnostics` | `Process` | `Start` |
| Path manipulation | `System.IO` | `File` | `Open`, `ReadAllText`, `WriteAllText` |

---

### Python — Django

| Rule purpose | module | className / function | functionName |
|---|---|---|---|
| Taint source (GET param) | `django.http.request` | `HttpRequest` | `GET.__getitem__`, `GET.get` |
| Taint source (POST param) | `django.http.request` | `HttpRequest` | `POST.__getitem__`, `POST.get` |
| SQL injection (raw) | `django.db.models` | `Manager` | `raw` |
| SQL injection (extra) | `django.db.models.query` | `QuerySet` | `extra` |
| XSS sink | `django.utils.safestring` | — | `mark_safe` |
| Template injection | `django.template` | `Template` | `render` |
| Command injection | `subprocess` | — | `call`, `run`, `Popen` |
| Open redirect | `django.http` | `HttpResponseRedirect` | Constructor (first arg) |

---

### Python — Flask

| Rule purpose | module | functionName |
|---|---|---|
| Taint source (request args) | `flask` | `request.args.get` |
| Taint source (request form) | `flask` | `request.form.get` |
| Template injection sink | `flask` | `render_template_string` |
| Path traversal sink | `flask` | `send_file` |
| XSS sink | `flask` | `make_response` — track `Response.set_data` |
| Open redirect | `flask` | `redirect` |

---

### JavaScript / TypeScript — Node.js / Express

| Rule purpose | module / object | functionName |
|---|---|---|
| Taint source (query param) | `express` / `Request` | `query` (property access) |
| Taint source (body param) | `express` / `Request` | `body` (property access) |
| SQL injection (MySQL) | `mysql` / `Connection` | `query` |
| NoSQL injection (MongoDB) | `mongodb` / `Collection` | `find`, `findOne`, `update` |
| XSS sink | `express` / `Response` | `send` |
| Template injection | `ejs` | `render`, `renderFile` |
| Command injection | `child_process` | `exec`, `execSync`, `spawn` |
| Code injection | (global) | `eval`, `Function` |
| Path traversal | `fs` | `readFile`, `readFileSync`, `createReadStream` |
| Open redirect | `express` / `Response` | `redirect` |

---

### Go — Standard Library

| Rule purpose | package | type / function |
|---|---|---|
| Taint source (HTTP param) | `net/http` | `Request.FormValue`, `Request.URL.Query` |
| SQL injection | `database/sql` | `DB.Query`, `DB.QueryRow`, `DB.Exec` |
| Command injection | `os/exec` | `Command` |
| Path traversal | `os` | `Open`, `Create`, `ReadFile` |
| XSS sink | `net/http` | `ResponseWriter.Write` |
| Template injection | `text/template` | `Template.Execute` — (use `html/template` instead) |
| Open redirect | `net/http` | `Redirect` |
| Weak random | `math/rand` | `Int`, `Int63`, `Intn` |

---

### Ruby on Rails

| Rule purpose | className | functionName |
|---|---|---|
| SQL injection | `ActiveRecord::Relation` | `where`, `find_by_sql`, `select` |
| SQL injection (string concat) | `ActiveRecord::Base` | `connection.execute` |
| XSS sink | `ActionView::Base` | `raw`, `html_safe` |
| Command injection | `Kernel` | `system`, `` `...` `` (backtick), `exec` |
| Path traversal | `File` | `read`, `open`, `new` |
| Open redirect | `ActionController::Base` | `redirect_to` |

---

### InArguments / OutArguments Reference

| Attribute | Meaning |
|-----------|---------|
| `<ApplyTo returnValue="true">` | Taint applies to the return value of this call |
| `<ApplyTo parameters="true" parameterIndex="N">` | Taint applies to argument N (0-indexed) |
| `<ApplyTo memberAccess="true">` | Taint applies to the object the method is called on |
| `<ApplyTo allParameters="true">` | Taint applies to all arguments |

When building a **source rule**, set `returnValue="true"` or `parameters="true"` on the argument that carries the tainted value out of the call.

When building a **sink rule**, set `parameters="true" parameterIndex="N"` on the argument that must not carry tainted data in.
