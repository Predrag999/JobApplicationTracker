package com.jobtracker.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

public class CustomOAuth2User implements OidcUser {

    private final OAuth2User delegate;
    private final UUID userId;

    public CustomOAuth2User(OAuth2User delegate, UUID userId) {
        this.delegate = delegate;
        this.userId = userId;
    }

    public UUID getUserId() { return userId; }

    @Override
    public Map<String, Object> getClaims() {
        return delegate instanceof OidcUser oidc ? oidc.getClaims() : delegate.getAttributes();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return delegate instanceof OidcUser oidc ? oidc.getUserInfo() : null;
    }

    @Override
    public OidcIdToken getIdToken() {
        return delegate instanceof OidcUser oidc ? oidc.getIdToken() : null;
    }

    @Override
    public Map<String, Object> getAttributes() { return delegate.getAttributes(); }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return delegate.getAuthorities(); }

    @Override
    public String getName() { return delegate.getName(); }
}
