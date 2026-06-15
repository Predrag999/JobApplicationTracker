package com.jobtracker.service;

import com.jobtracker.entity.User;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.security.CustomOAuth2User;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserRepository userRepository;
    private final OidcUserService delegate = new OidcUserService();

    public CustomOidcUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = delegate.loadUser(userRequest);

        String googleId = oidcUser.getSubject();
        String email    = oidcUser.getEmail();
        String name     = oidcUser.getFullName();
        String picture  = oidcUser.getPicture();

        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> {
                    User u = new User();
                    u.setGoogleId(googleId);
                    return u;
                });

        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(picture);
        user = userRepository.save(user);

        return new CustomOAuth2User(oidcUser, user.getId());
    }
}
