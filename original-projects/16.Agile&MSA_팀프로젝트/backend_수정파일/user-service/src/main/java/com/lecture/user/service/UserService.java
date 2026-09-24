package com.lecture.user.service;

import com.lecture.user.dto.UserDto;
import com.lecture.user.entity.User;
import com.lecture.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입
     */
    @Transactional
    public UserDto.UserResponse register(UserDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        User.UserType userType = request.getRole() != null ? request.getRole() : User.UserType.CUSTOMER;

        // 웨딩업체(VENDOR) 가입은 사업자등록번호 필수 — 국세청 진위확인 연동은 Sprint 2
        if (userType == User.UserType.VENDOR
                && (request.getBusinessRegNo() == null || request.getBusinessRegNo().isBlank())) {
            throw new IllegalArgumentException("업체 가입에는 사업자등록번호가 필요합니다");
        }

        // auth-server(수정 불가)의 Role enum은 STUDENT/INSTRUCTOR만 파싱한다 —
        // 도메인 역할은 userType에, role 컬럼에는 auth 호환 legacy 값을 저장 (트러블슈팅 로그 #8)
        User.Role authRole = (userType == User.UserType.CUSTOMER)
                ? User.Role.STUDENT : User.Role.INSTRUCTOR;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(authRole)
                .userType(userType)
                .businessRegNo(request.getBusinessRegNo())
                .businessName(request.getBusinessName())
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.UserResponse.from(savedUser);
    }

    /**
     * 사용자 단건 조회
     */
    public UserDto.UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id));
        return UserDto.UserResponse.from(user);
    }

    /**
     * 이메일로 사용자 조회 (서비스 간 내부 호출용)
     */
    public UserDto.UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
        return UserDto.UserResponse.from(user);
    }
}
