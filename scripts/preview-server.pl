#!/usr/bin/perl
# Rebuilds preview/index.html from src/plan/*.html on every page load and serves it on localhost.
use strict; use warnings;
use HTTP::Daemon; use HTTP::Response; use HTTP::Status;
use File::Basename qw(dirname); use Cwd qw(abs_path);

my $root = dirname(dirname(abs_path($0)));
my $port = $ENV{PORT} || 4321;
my $d = HTTP::Daemon->new(LocalAddr => '127.0.0.1', LocalPort => $port, ReuseAddr => 1)
  or die "Cannot start server on port $port: $!\n";
$| = 1;
$SIG{PIPE} = 'IGNORE'; # a browser closing a connection early must not stop the server
print "Preview running at http://localhost:$port/\n";

sub slurp { my $f = shift; open(my $fh, '<:raw', $f) or die "$f: $!"; local $/; my $c = <$fh>; close $fh; $c }

sub build {
  my $html = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n"
    . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
    . "<script>window.__tbHash=location.hash;</script>\n"
    . slurp("$root/src/plan/head.html") . "\n</head>\n<body>\n"
    . slurp("$root/src/plan/body.html") . join("", map { -f "$root/src/plan/$_" ? slurp("$root/src/plan/$_") : "" } qw(itineraries.html destinations.html)) . "\n</body>\n</html>\n";
  mkdir "$root/preview" unless -d "$root/preview";
  open(my $o, '>:raw', "$root/preview/index.html") or die $!; print $o $html; close $o;
  return $html;
}

my %types = (html=>'text/html; charset=utf-8', css=>'text/css', js=>'text/javascript', png=>'image/png',
  jpg=>'image/jpeg', jpeg=>'image/jpeg', svg=>'image/svg+xml', webp=>'image/webp', ico=>'image/x-icon');

while (my $c = $d->accept) {
  $c->timeout(5); # one request per connection, so a tab holding a connection open cannot block the server
  if (my $r = $c->get_request) {
    $c->force_last_request;
    my $path = $r->uri->path;
    if ($path eq '/' || $path eq '/index.html') {
      my $res = HTTP::Response->new(200);
      $res->header('Content-Type' => $types{html}, 'Cache-Control' => 'no-store');
      $res->content(build());
      $c->send_response($res);
    } elsif ($path !~ /\.\./ && -f "$root/public$path") {
      my ($ext) = $path =~ /\.(\w+)$/;
      my $res = HTTP::Response->new(200);
      $res->header('Content-Type' => $types{lc($ext // '')} || 'application/octet-stream');
      $res->content(slurp("$root/public$path"));
      $c->send_response($res);
    } else {
      $c->send_error(RC_NOT_FOUND);
    }
  }
  $c->close;
}
