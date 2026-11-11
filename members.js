const memberElement = (id) => document.getElementById(id);
const libraryKinds = { article: "Article", film: "Film", research: "Research" };
const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" });
let memberClient;
let signedInUser = null;
let signInEmail = "";
let circles = [];
let activeCircle = null;
let entriesRequest = 0;
let circlesRequest = 0;

function memberText(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function publicWebUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return null;
  }
  return null;
}

async function requestResult(request, failureMessage) {
  const { data, error } = await request;
  if (error) throw new Error(failureMessage);
  return data;
}

async function withControl(control, status, operation) {
  if (control.disabled) return;
  control.disabled = true;
  status.textContent = "";
  try {
    await operation();
  } catch (error) {
    status.textContent = error.message || "Something went wrong. Please try again.";
  } finally {
    control.disabled = false;
  }
}

function handleForm(id, status, submit) {
  const form = memberElement(id);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = new FormData(form);
    withControl(form.querySelector('[type="submit"]'), memberElement(status), () => submit(fields, form));
  });
}

function resetSignIn() {
  signInEmail = "";
  memberElement("email-form").hidden = false;
  memberElement("code-form").hidden = true;
  memberElement("code-form").reset();
  memberElement("auth-message").textContent = "";
}

function showUser(user) {
  if (signedInUser?.id === user?.id) return;
  signedInUser = user;
  circles = [];
  activeCircle = null;
  entriesRequest += 1;
  circlesRequest += 1;
  for (const video of memberElement("library-items").querySelectorAll("video")) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  for (const id of ["library-items", "circle-picker", "research-entries", "trip-entries"]) {
    memberElement(id).replaceChildren();
  }
  for (const id of ["library-message", "circles-message", "circle-message", "session-message", "circle-title", "circle-description"]) {
    memberElement(id).textContent = "";
  }
  for (const id of ["create-circle", "join-circle", "entry-form"]) memberElement(id).reset();
  memberElement("invite-code").value = "";
  memberElement("invite-result").hidden = true;
  memberElement("choose-circle").hidden = true;
  memberElement("circle-workspace").hidden = true;
  memberElement("circle-empty").hidden = false;
  memberElement("member-email").textContent = user?.email || "";
  memberElement("member-signin").hidden = Boolean(user);
  memberElement("member-overview").hidden = Boolean(user);
  memberElement("member-session").hidden = !user;
  memberElement("member-workspace").hidden = !user;
  resetSignIn();
  memberElement("email-form").reset();
  if (user) {
    loadLibrary(user);
    loadCircles(user).catch((error) => {
      if (signedInUser === user) memberElement("circles-message").textContent = error.message;
    });
  }
}

function addMediaControl(panel, item, user) {
  const button = memberText("button", item.kind === "film" ? "Load film" : "Prepare attachment", "button secondary");
  button.type = "button";
  const status = memberText("p", "");
  status.setAttribute("role", "status");
  panel.append(button, status);
  button.addEventListener("click", () => withControl(button, status, async () => {
    const asset = await requestResult(
      memberClient.storage.from("nexus-library").createSignedUrl(item.media_path, 900),
      "Could not open this file. Try again."
    );
    if (signedInUser !== user) return;
    const url = publicWebUrl(asset.signedUrl);
    if (!url) throw new Error("This file could not be opened.");
    if (item.kind === "film") {
      const video = document.createElement("video");
      video.className = "member-film";
      video.controls = true;
      video.playsInline = true;
      video.src = url;
      video.setAttribute("aria-label", item.title);
      panel.querySelector("video")?.remove();
      panel.append(video);
      button.textContent = "Reload film";
    } else {
      const link = memberText("a", "Open attachment", "button secondary");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      panel.querySelector("a")?.remove();
      panel.append(link);
    }
  }));
}

async function loadLibrary(user) {
  const status = memberElement("library-message");
  status.textContent = "Loading the library…";
  try {
    const items = await requestResult(memberClient.from("nexus_library")
      .select("id,kind,title,summary,body,media_path,published_at").order("published_at", { ascending: false }),
    "The library could not be loaded. Refresh to try again.");
    if (signedInUser !== user) return;
    status.textContent = items.length ? "" : "Library items will appear here when published.";
    const panels = items.map((item) => {
      const panel = memberText("article", "", "member-panel");
      panel.append(memberText("p", libraryKinds[item.kind], "section-label"), memberText("h3", item.title));
      if (item.summary) panel.append(memberText("p", item.summary));
      if (item.body) {
        const detail = document.createElement("details");
        detail.append(memberText("summary", "Read more"), memberText("p", item.body, "member-body"));
        panel.append(detail);
      }
      if (item.media_path) addMediaControl(panel, item, user);
      return panel;
    });
    memberElement("library-items").replaceChildren(...panels);
  } catch (error) {
    if (signedInUser === user) status.textContent = error.message;
  }
}

async function loadCircles(user, targetId) {
  const request = ++circlesRequest;
  const data = await requestResult(memberClient.from("nexus_circles").select("id,owner_id,name,description")
    .order("created_at", { ascending: false }), "Could not load your circles. Refresh to try again.");
  if (signedInUser !== user || request !== circlesRequest) return;
  circles = data;
  const options = circles.map((circle) => new Option(circle.name, circle.id));
  const picker = memberElement("circle-picker");
  picker.replaceChildren(...options);
  memberElement("choose-circle").hidden = !circles.length;
  picker.value = circles.find((circle) => circle.id === targetId)?.id || circles[0]?.id || "";
  selectCircle(picker.value);
}

function selectCircle(id) {
  activeCircle = circles.find((circle) => circle.id === id) || null;
  entriesRequest += 1;
  memberElement("circle-workspace").hidden = !activeCircle;
  memberElement("circle-empty").hidden = Boolean(activeCircle);
  memberElement("invite-result").hidden = true;
  memberElement("invite-code").value = "";
  memberElement("entry-form").reset();
  memberElement("add-entry").open = false;
  for (const id of ["research-entries", "trip-entries"]) memberElement(id).replaceChildren();
  if (!activeCircle) return;
  memberElement("circle-title").textContent = activeCircle.name;
  memberElement("circle-description").textContent = activeCircle.description;
  const ownsCircle = signedInUser.id === activeCircle.owner_id;
  memberElement("create-invite").hidden = !ownsCircle;
  memberElement("leave-circle").hidden = ownsCircle;
  loadEntries(activeCircle, signedInUser);
}

function renderEntry(entry, circle, user) {
  const panel = memberText("article", "", "member-panel member-entry");
  panel.append(memberText("h3", entry.title),
    memberText("p", `${entry.author_name} · ${dateFormat.format(new Date(entry.created_at))}`, "member-meta"),
    memberText("p", entry.body, "member-body"));
  const source = publicWebUrl(entry.source_url);
  if (source) {
    const link = memberText("a", "Open source or plan");
    link.href = source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    panel.append(link);
  }
  if (entry.author_id === user.id) {
    const remove = memberText("button", "Remove entry", "text-button");
    remove.type = "button";
    remove.addEventListener("click", () => {
      if (!window.confirm(`Remove “${entry.title}” from this circle?`)) return;
      withControl(remove, memberElement("circle-message"), async () => {
        await requestResult(memberClient.from("nexus_entries").delete().eq("id", entry.id),
          "The entry could not be removed.");
        if (activeCircle === circle && signedInUser === user) await loadEntries(circle, user);
      });
    });
    const actions = document.createElement("div");
    actions.append(remove);
    panel.append(actions);
  }
  return panel;
}

async function loadEntries(circle, user) {
  const request = ++entriesRequest;
  const status = memberElement("circle-message");
  status.textContent = "Loading circle entries…";
  try {
    const entries = await requestResult(memberClient.from("nexus_entries").select("*").eq("circle_id", circle.id)
      .order("created_at", { ascending: false }), "Could not load this circle's entries.");
    if (request !== entriesRequest || signedInUser !== user) return;
    status.textContent = "";
    for (const [kind, id, empty] of [
      ["research", "research-entries", "Research notes will appear here."],
      ["trip", "trip-entries", "Trip plans will appear here."]
    ]) {
      const panels = entries.filter((entry) => entry.kind === kind).map((entry) => renderEntry(entry, circle, user));
      memberElement(id).replaceChildren(...(panels.length ? panels : [memberText("p", empty)]));
    }
  } catch (error) {
    if (request === entriesRequest && signedInUser === user) status.textContent = error.message;
  }
}

function wireSignIn() {
  handleForm("email-form", "auth-message", async (fields) => {
    const email = fields.get("email").trim();
    await requestResult(memberClient.auth.signInWithOtp({ email }),
      "Could not send a sign-in code. Check the email address or try again shortly.");
    signInEmail = email;
    memberElement("email-form").hidden = true;
    memberElement("code-form").hidden = false;
    memberElement("code-form").elements.code.focus();
    memberElement("auth-message").textContent = `Check ${email} for your sign-in code.`;
  });
  handleForm("code-form", "auth-message", async (fields) => {
    const data = await requestResult(memberClient.auth.verifyOtp({
      email: signInEmail,
      token: fields.get("code").trim(),
      type: "email"
    }), "That code could not be verified. Check the latest email or request a new code.");
    showUser(data.user);
    memberElement("member-session").querySelector("a").focus();
  });
  memberElement("change-email").addEventListener("click", () => {
    resetSignIn();
    memberElement("email-form").elements.email.focus();
  });
  const signout = memberElement("member-signout");
  signout.addEventListener("click", () => withControl(signout, memberElement("session-message"), async () => {
    await requestResult(memberClient.auth.signOut({ scope: "local" }), "Could not sign out. Try again.");
    showUser(null);
    memberElement("email-form").elements.email.focus();
  }));
}

function wireCircles() {
  const picker = memberElement("circle-picker");
  picker.addEventListener("change", () => selectCircle(picker.value));
  handleForm("create-circle", "circles-message", async (fields, form) => {
    const user = signedInUser;
    const circle = await requestResult(memberClient.from("nexus_circles").insert({
      name: fields.get("name").trim(), description: fields.get("description").trim()
    }).select("id").single(), "Could not create the circle. Enter a name and try again.");
    if (signedInUser !== user) return;
    form.reset();
    memberElement("new-circle").open = false;
    await loadCircles(user, circle.id);
  });
  handleForm("join-circle", "circles-message", async (fields, form) => {
    const user = signedInUser;
    const circleId = await requestResult(memberClient.rpc("nexus_accept_invite", { invite_code: fields.get("invite").trim() }),
      "That code could not be accepted. Ask the circle owner for a fresh invitation.");
    if (signedInUser !== user) return;
    form.reset();
    memberElement("join-circle-details").open = false;
    await loadCircles(user, circleId);
  });
  handleForm("entry-form", "circle-message", async (fields, form) => {
    const circle = activeCircle;
    const user = signedInUser;
    const source = fields.get("source").trim();
    if (source && !publicWebUrl(source)) throw new Error("Use a web address beginning with https:// or http://.");
    await requestResult(memberClient.from("nexus_entries").insert({
      circle_id: circle.id,
      author_name: fields.get("author").trim(),
      kind: fields.get("kind"),
      title: fields.get("title").trim(),
      body: fields.get("body").trim(),
      source_url: source || null
    }), "Could not post this entry. Check the title, name and notes, then try again.");
    if (activeCircle !== circle || signedInUser !== user) return;
    form.reset();
    memberElement("add-entry").open = false;
    await loadEntries(circle, user);
  });
  const invite = memberElement("create-invite");
  invite.addEventListener("click", () => withControl(invite, memberElement("circle-message"), async () => {
    const circle = activeCircle;
    const code = await requestResult(memberClient.rpc("nexus_create_invite", { target_circle: circle.id }),
      "Could not create an invitation. Try again.");
    if (activeCircle !== circle) return;
    const input = memberElement("invite-code");
    input.value = code;
    memberElement("invite-result").hidden = false;
    input.focus();
    input.select();
  }));
  const leave = memberElement("leave-circle");
  leave.addEventListener("click", () => {
    if (!window.confirm(`Leave “${activeCircle.name}”? You will need a new invitation to rejoin.`)) return;
    withControl(leave, memberElement("circle-message"), async () => {
      const user = signedInUser;
      await requestResult(memberClient.from("nexus_circle_members").delete().eq("circle_id", activeCircle.id)
        .eq("user_id", user.id), "Could not leave the circle. Try again.");
      if (signedInUser === user) await loadCircles(user);
    });
  });
}

async function startMembers() {
  const config = window.cosmicNexusMembers;
  if (!config?.url || !config.publishableKey) return;
  try {
    const projectUrl = new URL(config.url);
    if (projectUrl.protocol !== "https:" || !config.publishableKey.startsWith("sb_publishable_")) {
      throw new Error("Invalid project settings");
    }
    await new Promise((resolve, reject) => {
      const sdk = document.createElement("script");
      sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js";
      sdk.integrity = "sha384-uteMfOloLDGt042uDz+xHGF3ym63/WQ6rFq7murQRG8Ih7QrXGEGNtWd8688sb4O";
      sdk.crossOrigin = "anonymous";
      sdk.onload = resolve;
      sdk.onerror = reject;
      document.head.append(sdk);
    });
    memberClient = window.supabase.createClient(projectUrl.href, config.publishableKey, {
      auth: { detectSessionInUrl: false, storage: window.sessionStorage }
    });
    const { session } = await requestResult(memberClient.auth.getSession(), "Sign-in could not be loaded.");
    wireSignIn();
    wireCircles();
    memberElement("member-preview").hidden = true;
    memberElement("member-signin").hidden = false;
    showUser(session?.user || null);
    memberClient.auth.onAuthStateChange((_event, updatedSession) => {
      setTimeout(() => showUser(updatedSession?.user || null), 0);
    });
  } catch {
    memberElement("member-launch-status").textContent = "Member sign-in is temporarily unavailable. Please try again later.";
  }
}

startMembers();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
