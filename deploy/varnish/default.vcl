vcl 4.1;

import bodyaccess;
import std;

backend default {
    .host = "site-perso-api-node";
    .port = "4100";
}

sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
        set resp.http.X-Cache-Hits = obj.hits;
    } else {
       set resp.http.X-Cache = "MISS";
       set resp.http.X-Cache-Hits = obj.hits;
    }
}

sub vcl_hash {
    bodyaccess.hash_req_body();
}

sub vcl_recv {
    return (hash);
}

sub vcl_backend_fetch {
    set bereq.method = "POST";
}
